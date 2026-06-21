import mongoose from "mongoose";
import { config } from "dotenv";
import { HowLongToBeatService } from "howlongtobeat-ts";
import {
  hasHltbTimes,
  mapHltbEntryToField,
  pickBestHltbMatch,
} from "../src/module/games/utils/hltb.utils";

config();

type SeedGameDoc = {
  _id: unknown;
  name: string;
  slug: string;
};

const gameSchema = new mongoose.Schema({}, { strict: false, collection: "games" });
const Game = mongoose.model("Game", gameSchema);

async function main() {
  const slug = process.argv[2] || "elden-ring";

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
  });

  const game = await Game.findOne({ slug })
    .select("name slug hltb")
    .lean<SeedGameDoc>();

  if (!game) {
    throw new Error(`Game not found: ${slug}`);
  }

  const hltbClient = new HowLongToBeatService();
  const response = await hltbClient.search(game.name);

  if (!response.success || !response.data?.length) {
    throw new Error(`HLTB search failed for ${game.name}`);
  }

  const match = pickBestHltbMatch(
    response.data.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mainTime: entry.mainTime,
      mainExtraTime: entry.mainExtraTime,
      completionistTime: entry.completionistTime,
      similarity: entry.similarity,
    })),
    game.name
  );

  if (!match) {
    throw new Error(`No HLTB match for ${game.name}`);
  }

  const hltb = mapHltbEntryToField(match);

  if (!hasHltbTimes(hltb)) {
    throw new Error(`HLTB match has no times for ${game.name}`);
  }

  await Game.updateOne(
    { slug },
    { $set: { hltb, updatedAt: new Date().toISOString() } }
  );

  const updated = await Game.findOne({ slug }).select("name slug hltb").lean();

  console.log(JSON.stringify(updated, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
