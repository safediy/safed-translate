const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const downloadTelegramFile = require("../helpers/downloadTelegramFile");
const extractTextFromImg = require("../helpers/extractTextFromImg");
const extractTextFromPdf = require("../helpers/extractTextFromPdf");
const extractTextFromDocx = require("../helpers/extractTextFromDocx");
const extractTextFromXlsx = require("../helpers/extractTextFromXlsx");
const sendLongMessage = require("../helpers/sendLongMessage");

const translateText = require("../helpers/translateText")
const SUPPORTED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const SUPPORTED_DOCX_EXTS = new Set(['.docx', '.doc']);
const SUPPORTED_XLSX_EXTS = new Set(['.xlsx', '.xls']);
const DEFAULT_ERROR_MSG = '❌ Tarjima qilib bo‘lmadi.';
const MAX_MEDIA_SIZE_MB = Number(process.env.MAX_MEDIA_SIZE_MB || 20);
const MAX_MEDIA_SIZE_BYTES = Math.max(1, MAX_MEDIA_SIZE_MB) * 1024 * 1024;
const MAX_OCR_TEXT_CHARS = Number(process.env.MAX_OCR_TEXT_CHARS || 100000);
const PDF_MAX_PAGES = Number(process.env.PDF_MAX_PAGES || 30);
const XLSX_MAX_ROWS = Number(process.env.XLSX_MAX_ROWS || 5000);
const activeChats = new Set();

const { extractLanguages } = require("../../base/languages")



/**
 * Handles media files sent to the bot
 * @param {TelegramBot} bot - Bot instance
 * @param {TelegramBot.Message} msg - Message object
 * @param {'photo' | 'document' | 'voice' | 'video_note' | 'video'} type - Media type
 * @returns {Promise<void>}
 */
async function handleMedia(bot, msg, type) {

  const chatId = msg.chat.id;
  const reply_to_message_id = msg.message_id;
  let deleteMessageId = null;

  if (activeChats.has(chatId)) {
    await bot.sendMessage(chatId, "⏳ Oldingi fayl hali qayta ishlanmoqda, iltimos kuting.", { reply_to_message_id });
    return;
  }
  activeChats.add(chatId);


  bot.sendChatAction(chatId, 'typing');
  await bot.sendMessage(chatId, '⚙️ Matn olinmoqda...', {
    parse_mode: "Markdown",
    reply_to_message_id
  }).then((sentMessage) => {
    deleteMessageId = sentMessage.message_id;
  });

  try {
    // Validate and get file data
    const fileData = getFileData(msg, type);

    if (!fileData?.file_id) {
      throw new Error('Invalid file data received');
    }

    if (fileData.file_size && fileData.file_size > MAX_MEDIA_SIZE_BYTES) {
      const fileSizeMb = (fileData.file_size / (1024 * 1024)).toFixed(2);
      throw new Error(`Fayl juda katta (${fileSizeMb} MB). Maksimal ruxsat etilgan hajm: ${MAX_MEDIA_SIZE_MB} MB.`);
    }

    // Download file
    const { localFilePath, fileName } = await downloadTelegramFile(bot, fileData, {
      maxFileSizeBytes: MAX_MEDIA_SIZE_BYTES,
    });

    // Process file based on type
    let text = await processMediaFile(localFilePath, {
      mimeType: fileData.mime_type,
      fileExt: path.extname(fileName).toLowerCase(),
      caption: msg?.caption
    });

    if (text?.length > MAX_OCR_TEXT_CHARS) {
      text = text.slice(0, MAX_OCR_TEXT_CHARS) + `\n\n[Matn qisqartirildi: juda katta natija]`;
    }

    const languageCode = extractLanguages(msg?.caption);
    if (languageCode) {
      text = await translateText(text, languageCode)
    }

    await sendLongMessage(bot, chatId, text || DEFAULT_ERROR_MSG, { reply_to_message_id });
    if (deleteMessageId) {
      await bot.deleteMessage(chatId, deleteMessageId).catch(() => null);
    }

  } catch (error) {
    console.error('Media handling error:', error);
    await bot.sendMessage(chatId, `${DEFAULT_ERROR_MSG}\n\nXatolik: ${error.message}`);
    if (deleteMessageId) {
      await bot.deleteMessage(chatId, deleteMessageId).catch(() => null);
    }
  } finally {
    activeChats.delete(chatId);
  }

  return
}


/**
 * Processes media file based on its type
 * @param {string} filePath - Local file path
 * @param {object} fileInfo - File information
 * @param {string} fileInfo.mimeType - MIME type
 * @param {string} fileInfo.fileExt - File extension
 * @returns {Promise<string>} Extracted text
 */
async function processMediaFile(filePath, { mimeType, fileExt }) {
  try {
    if (mimeType?.includes('pdf')) {
      return await extractTextFromPdf(filePath, { maxPages: PDF_MAX_PAGES });
    }

    if (SUPPORTED_IMAGE_EXTS.has(fileExt)) {
      return await extractTextFromImg(filePath);
    }

    if (SUPPORTED_DOCX_EXTS.has(fileExt)) {
      return await extractTextFromDocx(filePath);
    }

    if (SUPPORTED_XLSX_EXTS.has(fileExt)) {
      return await extractTextFromXlsx(filePath, { maxRows: XLSX_MAX_ROWS });
    }

    throw new Error(`Qo'llab-quvvatlanmaydigan fayl formati: ${mimeType} (${fileExt})`);
  } catch (error) {
    console.error('File processing error:', error);
    throw new Error(`Fayl qayta ishlashda xatolik: ${error.message}`);
  }
}

/**
 * Extracts file data from message object
 * @param {TelegramBot.Message} msg - Message object
 * @param {string} type - Media type
 * @returns {object|null} File data
 */
function getFileData(msg, type) {
  if (!msg || typeof msg !== 'object') return null;
  return type === 'photo' ? msg?.photo?.at(-1) ?? msg?.reply_to_message?.photo?.at(-1) : msg?.[type];
}

module.exports = { handleMedia };
