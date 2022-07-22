import request from "../requestV2";
import Promise from "../PromiseV2";
import Settings from "./config";

//Object that stores player data
//keys are player usernames and values are objects in the form below
let storedPlayerData = {};

export function isPlayerStored(playerName) {
    //ChatLib.chat(Object.keys(storedPlayerData).includes(playerName) + " " + playerName + " " + Object.keys(storedPlayerData));
    return Object.keys(storedPlayerData).includes(playerName);
}

export function retrieveFromSaved(playerName) {
    return storedPlayerData[playerName];
}

/**
 * returns a Promise that delivers an object that contains
 * name: String
 * selectedClassName: string,
 * selectedClassLevel: number,
 * catacombsLevel: number,
 * lastRefresh: number
 */
export default function getCataData(playerName) {
    return new Promise((resolve, reject) => {
        if (Object.keys(storedPlayerData).includes(playerName)) {
            //10 minute refresh timer for stored player data
            if (Date.now() - storedPlayerData[playerName].lastRefresh < 600000) {
                //console.log(`resolving ${playerName} with stored data`);
                resolve(storedPlayerData[playerName]);
                return;
            } else {
                delete storedPlayerData[playerName];
            }
        } else {
            //ChatLib.chat(`number of saved players: ${Object.keys(storedPlayerData).length}`);

            request(`https://api.mojang.com/users/profiles/minecraft/${playerName}`).then(function (mojangResponse) {
                const uuid = JSON.parse(mojangResponse).id;
                request(`https://api.hypixel.net/skyblock/profiles?key=${Settings.apiKey}&uuid=${uuid}`).then(function (hypixelResponse) {
                    const profiles = JSON.parse(hypixelResponse).profiles;
                    let lastSaveComparison = 0;
                    let selectedProfileID = "";
                    for (let profile of profiles) {
                        if (profile.members[uuid].last_save > lastSaveComparison) {
                            lastSaveComparison = profile.members[uuid].last_save;
                            selectedProfileID = profile.profile_id;
                        }
                    }
                    for (let profile of profiles) {
                        if (profile.profile_id == selectedProfileID) {
                            const catacombsObj = profile.members[uuid].dungeons.dungeon_types.catacombs;
                            const cataXP = catacombsObj.hasOwnProperty("experience") ? catacombsObj.experience : 0;
                            const cataLevel = getLevel(cataXP);

                            const selectedClass = profile.members[uuid].dungeons.selected_dungeon_class != null ? profile.members[uuid].dungeons.selected_dungeon_class : "mage";
                            const classXP = profile.members[uuid].dungeons.player_classes[selectedClass].hasOwnProperty("experience") ? profile.members[uuid].dungeons.player_classes[selectedClass].experience : 0;
                            const classLevel = getLevel(classXP);

                            storedPlayerData[playerName] = {
                                name: playerName,
                                selectedClassName: selectedClass,
                                selectedClassLevel: classLevel,
                                catacombsLevel: cataLevel,
                                lastRefresh: Date.now()
                            };
                            resolve(storedPlayerData[playerName]);
                        }
                    }
                }).catch(function (error) {
                    reject(error);
                });
            }).catch(function (error) {
                reject(error);
            });
        }
    });
}

//takes in cata (and also technically class) xp and returns the player's cata (and also technically class) level
function getLevel(xp) {
    var cumulativeXP = [0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700, 17960, 25340,
        35640, 50040, 70040, 97640, 135640, 188140, 259640, 356640, 488640, 668640, 911640, 1239640, 1684640, 2284640,
        3084640, 4149640, 5559640, 7459640, 9959640, 13259640, 17559640, 23159640, 30359640, 39559640, 51559640,
        66559640, 85559640, 109559640, 139559640, 177559640, 225559640, 285559640, 360559640, 453559640, 569809640];

    if (xp >= cumulativeXP[50]) {
        return 50;
    }

    for (var i = 0; i < 50; i++) {
        if (xp >= cumulativeXP[i] && xp < cumulativeXP[i + 1]) {
            return i;
        }
    }
}