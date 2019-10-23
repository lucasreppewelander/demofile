// tslint:disable:no-console

import { parse } from "@node-steam/vdf";
import fs = require("fs");
import path = require("path");
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);

const fromEntries = (arr: ReadonlyArray<[any, any]>) =>
  Object.assign({}, ...Array.from(arr, ([k, v]) => ({ [k]: v })));

async function parseItems(root: string) {
  const itemData = await readFileAsync(
    path.join(root, "scripts", "items", "items_game.txt"),
    "utf-8"
  );
  const { items_game: items } = parse(itemData);

  const englishData = await readFileAsync(
    path.join(root, "resource", "csgo_english.txt"),
    "utf16le"
  );
  const { lang } = parse(englishData);
  const tokens = new Map(
    Object.entries(lang.Tokens).map(([token, value]) => [
      token.toLowerCase(),
      value as string
    ])
  );

  const translate = (token: string | undefined) =>
    token && token[0] === "#"
      ? tokens.get(token.substr(1).toLowerCase())
      : token;

  console.log("// DO NOT MODIFY!");
  console.log("// Auto-generated by ./generators/itemdefs.ts");
  console.log("");
  console.log(
    `interface IItemDefinition {
  itemName: string;
  className: string;
}`
  );
  console.log("");

  console.log(
    `export const itemDefinitionIndexMap: {
  [itemIndex: string]: IItemDefinition | undefined;
} = ` +
      JSON.stringify(
        fromEntries(
          Object.entries(items.items)
            .filter(([key, item]: [string, any]) =>
              item.name.startsWith("weapon_")
            )
            .map(
              ([key, item]: [string, any]): [number, any] => [
                parseInt(key, 10),
                {
                  className: item.name,
                  itemName: translate(
                    items.prefabs[item.prefab].item_name || item.item_name
                  )
                }
              ]
            )
            .filter(([key, x]: [number, any]) => x.itemName)
        ),
        null,
        2
      )
  );
}

// argument should be path to "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\csgo"
parseItems(process.argv[2]).catch(err => console.error(err));