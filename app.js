// const fs = require("fs/promises");
import * as fs from "fs/promises";
import { Buffer } from "buffer";

(async () => {
  const createFile = async (filePath) => {
    console.log(`Creating a file ${filePath}...`);
    try {
      //we are checking whether the file already exists
      const existingFileHandle = await fs.open(filePath, "r");
      //we already have a file
      existingFileHandle.close();
      return console.log(`The file ${filePath} already exists.`);
    } catch (error) {
      //we don't have the file, now we should create it
      const newFileHandle = await fs.open(filePath, "w"); //w flag means we are writing
      console.log("A new file was successfully created.");
      newFileHandle.close();
    }
  };

  const deleteFile = async (filePath) => {
    console.log(`Deleting the file ${filePath}...`);
    try {
      const existingFileHandle = await fs.open(filePath, "r");
      // we already have the file
      existingFileHandle.close();
      //now we will delete it
      await fs.rm(filePath);
      console.log("The file was successfully deleted.");
    } catch (error) {
      // we don't have the file!
      return console.log(`The file ${filePath} does not exist.`);
    }
  };

  let renamedFile = false;

  const renameFile = async (oldFilePath, newFilePath) => {
    if (renamedFile) return;
    console.log(`Renaming the file ${oldFilePath} to ${newFilePath}...`);
    try {
      await fs.rename(oldFilePath, newFilePath);
      renamedFile = true;
      console.log("The file was successfully renamed.");
    } catch (e) {
      if (renamedFile) return;
      if (e.code === "ENOENT") {
        console.log(
          "No file at this path to rename, or the destination doesn't exist."
        );
        console.log(e);
      } else {
        console.log("An error occurred while removing the file: ");
        console.log(e);
      }
    }
  };

  let addedContent = "";

  const addToFile = async (filePath, content) => {
    if (addedContent === content) return;
    console.log(`Appending to file ${filePath}...`);
    console.log(`Content: ${content}`);
    try {
      console.log(addedContent, content);
      const fileHandle = await fs.open(filePath, "a"); // "a" flag signifies opening the file for appending
      fileHandle.write(content);
      addedContent = content;
      console.log("Content appended to file successfully.");
      fileHandle.close();
    } catch (error) {
      console.log("An error occurred while appending to the file: ");
      console.log(error);
    }
  };

  // COMMANDS

  // create command ->
  const CREATE = "create a file";

  //delete command ->
  const DELETE = "delete a file";

  // rename command ->
  const RENAME = "rename a file";

  // add to file command ->
  const ADD_TO_FILE = "add to file";

  const commandFileHandler = await fs.open("./command.txt", "r"); //when you are opening the file, you are just saving a number in your memory, not actually opening the file!
  //this 'r'flag above signifies that the file will be open only for reading purposes. For other flags, refer to the docs

  commandFileHandler.on("change", async () => {
    //defining the event, this is just a random change.

    //   console.log(`The file was just edited.`);

    //allocating our buffer with the perfect size
    const size = (await commandFileHandler.stat()).size;
    const buff = Buffer.alloc(size);
    const offset = 0; //location at which we want to start filling our file
    const length = buff.byteLength; //how many bytes we want to read in our buffer
    const position = 0; //posiition at which we want to start reading our file from
    await commandFileHandler.read(buff, offset, length, position); //we always want to read the whole content from the beginning to the end

    const command = buff.toString("utf-8");

    // create a file:
    // command -> create a file <path>

    if (command.includes(CREATE)) {
      const filePath = command.substring(CREATE.length + 1);
      createFile(filePath);
    }

    // delete a file:
    // command -> delete a file <path>

    if (command.includes(DELETE)) {
      const filePath = command.substring(DELETE.length + 1);
      deleteFile(filePath);
    }

    //rename a file:
    // command -> rename a file <oldPath> to <newPath>

    if (command.includes(RENAME)) {
      const _idx = command.indexOf(" to ");
      const oldFilePath = command.substring(RENAME.length + 1, _idx);
      const newFilePath = command.substring(_idx + 4);

      renameFile(oldFilePath, newFilePath);
    }

    // add to file:
    // command -> add to file <path> this <content>

    if (command.includes(ADD_TO_FILE)) {
      const _idx = command.indexOf(" content ");
      const filePath = command.substring(ADD_TO_FILE.length + 1, _idx);
      const content = command.substring(_idx + 9);

      addToFile(filePath, content);
    }
  });

  const watcher = fs.watch("./command.txt");
  //watcher is an async iterable
  for await (const event of watcher) {
    if (event.eventType === "change") {
      commandFileHandler.emit("change");
    }
  }
})();
