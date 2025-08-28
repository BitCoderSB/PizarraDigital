import { getDB } from '../../../shared/db.js';
const COLL = 'boards';


export async function findBoardById(id) {
  return getDB()
    .collection(COLL)
    .findOne({ _id: id });
}


export async function createBoard(id) {
  const now = new Date();
  await getDB()
    .collection(COLL)
    .updateOne(
      { _id: id },
      {
        $setOnInsert: { elements: [], createdAt: now },
        $set:         { updatedAt: now }
      },
      { upsert: true }
    );
  return id;
}

export async function upsertElement(boardId, element) {
  const col = getDB().collection(COLL);
  const res = await col.updateOne(
    { _id: boardId, 'elements.id': element.id },
    {
      $set: {
        'elements.$': element,
        updatedAt:     new Date()
      }
    }
  );
  if (res.matchedCount === 0) {
    await col.updateOne(
      { _id: boardId },
      {
        $push: { elements: element },
        $set:  { updatedAt: new Date() }
      }
    );
  }
  return res;
}

export async function updateElements(boardId, elements) {
  return getDB()
    .collection(COLL)
    .updateOne(
      { _id: boardId },
      { $set: { elements, updatedAt: new Date() } }
    );
}

export async function deleteElement(boardId, elementId) {
  return getDB()
    .collection(COLL)
    .updateOne(
      { _id: boardId },
      {
        $pull: { elements: { id: elementId } },
        $set:  { updatedAt: new Date() }
      }
    );
}
