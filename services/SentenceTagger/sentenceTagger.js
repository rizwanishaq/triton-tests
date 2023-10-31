import grpc from "@grpc/grpc-js";
import path from "path";
import protoLoader from "@grpc/proto-loader";
import { bufferToFloat32 } from "../../utils/utils.js";

const packageDefinition = protoLoader.loadSync(
  path.resolve("protocol", "grpc_service.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const inferencePackage = protoDescriptor.inference;

class QuestionAnswerService {
  /**
   * Initialize the QuestionAnswerService.
   * @param {string} modelName - Name of the Triton model to use.
   * @param {number} sequenceId - The initial sequence ID.
   */
  constructor(modelName = "sentence_tagger", sequenceId) {
    this.modelName = modelName;
    this.tritonServerHost = process.env.triton_server_host || "100.100.100.174";
    this.tritonServerPort = process.env.triton_server_port || 9001;

    try {
      this.client = new inferencePackage.GRPCInferenceService(
        `${this.tritonServerHost}:${this.tritonServerPort}`,
        grpc.credentials.createInsecure()
      );
    } catch (error) {
      console.error(`Error initializing QuestionAnswerService: ${error}`);
      throw error;
    }

    this.sequenceId = sequenceId;
  }

  /**
   * Predict the answer for a given question.
   * @param {string} question - The input question.
   * @returns {Promise<{ answer: string, confidence: number }>} - A promise that resolves to the predicted answer and confidence score.
   * @throws Will reject the promise with an error message if there's an issue with the request.
   */
  predictAnswer(question) {
    return new Promise((resolve, reject) => {
      const questionBuffer = Buffer.from(question);
      const request = {
        model_name: this.modelName,
        inputs: [
          {
            name: "text_in",
            datatype: "BYTES",
            shape: [1, 1],
            contents: { byte_contents: [questionBuffer] },
          },
        ],
        outputs: [{ name: "text_out" }, { name: "score" }],
        parameters: {
          sequence_id: { int64_param: this.sequenceId },
          sequence_start: { bool_param: false },
          sequence_end: { bool_param: false },
        },
      };

      this.client.ModelInfer(request, (err, response) => {
        if (err) {
          console.error(`Error during request -> ${err}`);
          console.error(`Request Details -> ${JSON.stringify(request)}`);
          this.close();
          reject(`Error during request -> ${err}`);
          return;
        }

        resolve({
          answer: response.raw_output_contents[0].toString("utf8", 4),
          confidence: bufferToFloat32(response.raw_output_contents[1])[0],
        });
      });
    });
  }

  /**
   * Send a start or stop command to the model.
   * @param {boolean} sequenceStart - Indicates if it's the start of a sequence.
   * @param {boolean} sequenceEnd - Indicates if it's the end of a sequence.
   * @returns {Promise<string>} - A promise that resolves with a message indicating the action.
   * @throws Will reject the promise with an error message if there's an issue with the request.
   */
  sendStartStopCommand(sequenceStart, sequenceEnd) {
    return new Promise((resolve, reject) => {
      const command = sequenceStart ? "START" : "STOP";
      const commandBuffer = Buffer.from(command);

      const request = {
        model_name: this.modelName,
        inputs: [
          {
            name: "text_in",
            datatype: "BYTES",
            shape: [1, 1],
            contents: {
              byte_contents: [commandBuffer],
            },
          },
        ],
        outputs: [],
        parameters: {
          sequence_id: { int64_param: this.sequenceId },
          sequence_start: { bool_param: sequenceStart },
          sequence_end: { bool_param: sequenceEnd },
        },
      };

      this.client.ModelInfer(request, (err, _) => {
        if (err) {
          console.error(`Error during ${command} request -> ${err}`);
          console.error(`Request Details -> ${JSON.stringify(request)}`);
          reject(`Error during ${command} request -> ${err}`);
          return;
        }

        const action = sequenceStart ? "started" : "stopped";
        const message = `Stream with sequence_id ${this.sequenceId} ${action}`;

        resolve(message);
      });
    });
  }

  /**
   * Start the question answering process.
   * @returns {Promise<string>} - A promise that resolves with a message indicating the action.
   * @throws Will reject the promise with an error message if there's an issue with the request.
   */
  start() {
    return this.sendStartStopCommand(true, false);
  }

  /**
   * Stop the question answering process.
   * @returns {Promise<string>} - A promise that resolves with a message indicating the action.
   * @throws Will reject the promise with an error message if there's an issue with the request.
   */
  stop() {
    return this.sendStartStopCommand(false, true);
  }

  /**
   * Close the connection to the Triton server.
   */
  close() {
    if (this.client && !this.client.isClosed) {
      this.client.close();
    }
  }
}

export default QuestionAnswerService;
