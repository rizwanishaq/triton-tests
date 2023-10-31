import QuestionAnswerService from "./services/SentenceTagger/sentenceTagger.js";
import { generateUniqueSequenceId } from "./utils/utils.js";

/**
 * Process a line of conversation.
 * @param {string} line - The conversation line to process.
 * @returns {Promise<Object>} - A promise that resolves to the processed result.
 */
async function processLine(line) {
  try {
    const result = await questionAnswerService.predictAnswer(line);
    return {
      line,
      result: {
        answer: result.answer,
        confidence: result.confidence,
      },
    };
  } catch (error) {
    console.error(error);
  }
}

// Initialize the QuestionAnswerService
const questionAnswerService = new QuestionAnswerService(
  "sentence_tagger",
  generateUniqueSequenceId()
);

/**
 * Start processing the conversation.
 */
async function startProcessing() {
  try {
    // Start the question answering process
    const startMessage = await questionAnswerService.start();
    console.log(startMessage);

    // Define the conversation
    const conversation = `
    Carlos Alberto: Buenos días Imprenta CSD. En qué le puedo ayudar\nMiguel Colina: Hola Me puede comunicar con Enrique López\nCarlos Alberto: El señor Lopez no está en su oficina Desea dejar un mensaje\nMiguel Colina: Sí me llamo Miguel Colina 44680089-J llamo para confirmar el último pedido que le hice al señor Lopez en el mes de agosto\nCarlos Alberto: Tiene el número de pedido\n\nMiguel Colina: Sí es el 25142566598\nCarlos Alberto: 25142566598\nMiguel Colina: Sí ése mismo\nCarlos Alberto: Cuál es el pedido\nMiguel Colina: 500 calendarios para el año que viene con las fotos de los clientes\nCarlos Alberto: Bien Enviamos el pedido lo recibirá en los próximos días laborables\nMiguel Colina: Excelente\nCarlos Alberto: Me puede dar su número de teléfono\nMiguel Colina: Sí le puede decir al señor López que me llame al 5554567\nCarlos Alberto: Desea algo más\nMiguel Colina: Eso es todo Muchas gracias\n
    `;

    const lines = conversation.split("\n");

    // Process each line of conversation using Promise.all
    const results = await Promise.all(
      lines
        .filter((line) => line.trim().length > 0)
        .map((line) => processLine(line))
    );

    console.log("Processed Results:", results);

    // Stop the question answering process
    const stopMessage = await questionAnswerService.stop();
    console.log(stopMessage);
  } catch (error) {
    console.error(error);
  } finally {
    await questionAnswerService.close();
  }
}

startProcessing();
