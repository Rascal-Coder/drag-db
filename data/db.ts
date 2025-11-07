import Dexie from "dexie";

const DB_VERSION = 6;
const DB_NAME = "drawDB";
export const db = new Dexie(DB_NAME);
db.version(DB_VERSION).stores({
  diagrams: "++id, lastModified, loadedFromGistId",
});
