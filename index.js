import request from "../requestV2"
import PogObject from "../PogData"
import Settings from "./config";
import { Color } from "Vigilance";
import getPartyMembers from "./PartyLib";
import getCataData, { isPlayerStored, retrieveFromSaved } from "./CataDataLib";

//saves gui values in .data.json
let guiConfig = new PogObject("CataHover", {
	xMin: 100,
	yMin: 210,
	xMax: 340,
	yMax: 390,
});

//Color codes and prefix so I don't have to keep typing them later
const darkColor = "§4";
const lightColor = "§c";
const emphasisColor = "§7";
const prefix = `${darkColor}§lCataHover§r§7>${lightColor}`;


let shouldDrawOverlay = false; //tells the renderer if a player is in party finder and hovering over a party

//All of these variables come directly from the lore of the current party the player is hovering over
let pLeaderFormatted = "";     //stores the formatted name of the party leader
let dType = "";				   //stores the dungeon type (i.e. The Catacombs, The Master Mode Catacombs)
let dFloor = "";			   //stores the dungeon floor (i.e. Floor VII)
let dNote = "";				   //stores the note in party finder
let classLevelReq = 0;         //stores the class level required to join the party
let dLevelReq = 0;             //stores the dungeon level required to join the party
let memberList = [];		   //stores a list of json objects for every member of the party containing their name, class, and class level

//Detects when a player hovers over a party in party finder and takes information from it
register("itemTooltip", (lore, item, e) => {
	//Regex objects used to pull information from each party
	const partyTitleRE = /^§6(§\w+)'s Party/;
	const dTypeRE = /^Dungeon: (.+)/;
	const dFloorRE = /^Floor: (.+)/;
	const dNoteRE = /^Note: (.+)/;
	const classLevelReqRE = /^Class Level Required: (\d{0,2})/;
	const dLevelReqRE = /^Dungeon Level Required: (\d{0,2})/;
	const memberLineRE = /^ (\w+): (\w+) \((\d{1,2})\)$/;

	const name = item.getName();
	memberList = []; //Reset the member list

	//Determines if the 'item' the player is hovering over is a party in party finder
	shouldDrawOverlay = partyTitleRE.test(name);
	if (shouldDrawOverlay && Settings.overlayEnabled) {
		//save the party leader's formatted name to render in the overlay
		pLeaderFormatted = partyTitleRE.exec(name)[1];
		//For each line in the party finder message, save the relevant information to the variables from earlier
		for (let line of lore) {
			line = line.removeFormatting();
			if (dTypeRE.test(line)) {
				dType = dTypeRE.exec(line)[1].replace("The ", "").replace(" Catacombs", "");
			} else if (dFloorRE.test(line)) {
				dFloor = dFloorRE.exec(line)[1];
			} else if (dNoteRE.test(line)) {
				dNote = dNoteRE.exec(line)[1];
			} else if (classLevelReqRE.test(line)) {
				classLevelReq = classLevelReqRE.exec(line)[1];
			} else if (dLevelReqRE.test(line)) {
				dLevelReq = dLevelReqRE.exec(line)[1];
			} else if (memberLineRE.test(line)) {
				memberList.push({
					name: memberLineRE.exec(line)[1],
					classType: memberLineRE.exec(line)[2],
					classLevel: memberLineRE.exec(line)[3]
				});
			}
		}
	}
});

//Background objects for the overlay
const border = new Rectangle(cc(Settings.borderColor), guiConfig.xMin, guiConfig.yMin, guiConfig.xMax - guiConfig.xMin, guiConfig.yMax - guiConfig.yMin).setOutline(cc(Settings.shadowColor), Settings.shadowThickness);
const base = new Rectangle(cc(Settings.mainColor), guiConfig.xMin + Settings.borderThickness, guiConfig.yMin + Settings.borderThickness, guiConfig.xMax - guiConfig.xMin - (2 * Settings.borderThickness), guiConfig.yMax - guiConfig.yMin - (2 * Settings.borderThickness)).setOutline(cc(Settings.shadowColor), Settings.shadowThickness);

//aligns the text in the overlay based on the lefthand side of the box
let textAlignX = guiConfig.xMin + 17;

//renders a box in the config screen that should be roughly the size of the party finder as well as instructions on how to use the tool
const inventoryBox = new Rectangle(cc(new Color(1, 1, 1, 0.5)), 392, 188, 175, 219);
const line1 = new Text(`${lightColor}Select corner and move it with`, 395, 191).setShadow(Settings.textShadow);
const line2 = new Text(`${lightColor}arrow keys`, 395, 201).setShadow(Settings.textShadow);
const line3 = new Text(`${lightColor}Hold shift to move in`, 395, 216).setShadow(Settings.textShadow);
const line4 = new Text(`${lightColor}smaller increments`, 395, 226).setShadow(Settings.textShadow);
const line5 = new Text(`${lightColor}Use /csettings to change`, 395, 241).setShadow(Settings.textShadow);
const line6 = new Text(`${lightColor}colors, thicknesses, and text`, 395, 251).setShadow(Settings.textShadow);
const line7 = new Text(`${lightColor}shadow`, 395, 261).setShadow(Settings.textShadow);

//config tools plus the coordinates of the squares to detect when the player clicks on one
const yellowConfigOutline = new Rectangle(Renderer.YELLOW, guiConfig.xMin - 3, guiConfig.yMin - 3, guiConfig.xMax - guiConfig.xMin + 6, guiConfig.yMax - guiConfig.yMin + 6);
const configSquare1 = new Rectangle(Renderer.GRAY, guiConfig.xMin - 6, guiConfig.yMin - 6, 6, 6).setOutline(Renderer.BLACK, 1);
let cs1Cx = guiConfig.xMin - 3; let cslCy = guiConfig.yMin - 3;
const configSquare2 = new Rectangle(Renderer.GRAY, guiConfig.xMin - 6, guiConfig.yMax, 6, 6).setOutline(Renderer.BLACK, 1);
let cs2Cx = guiConfig.xMin - 3; let cs2Cy = guiConfig.yMax + 3;
const configSquare3 = new Rectangle(Renderer.GRAY, guiConfig.xMax, guiConfig.yMax, 6, 6).setOutline(Renderer.BLACK, 1);
let cs3Cx = guiConfig.xMax + 3; let cs3Cy = guiConfig.yMax + 3;
const configSquare4 = new Rectangle(Renderer.GRAY, guiConfig.xMax, guiConfig.yMin - 6, 6, 6).setOutline(Renderer.BLACK, 1);
let cs4Cx = guiConfig.xMax + 3; let cs4Cy = guiConfig.yMin - 3;

//function to update all of the above when a config value has been changed
function reloadOverlayPos() {
	border.setColor(cc(Settings.borderColor)).setX(guiConfig.xMin).setY(guiConfig.yMin).setWidth(guiConfig.xMax - guiConfig.xMin).setHeight(guiConfig.yMax - guiConfig.yMin).setOutline(cc(Settings.shadowColor), Settings.shadowThickness);
	base.setColor(cc(Settings.mainColor)).setX(guiConfig.xMin + Settings.borderThickness).setY(guiConfig.yMin + Settings.borderThickness).setWidth(guiConfig.xMax - guiConfig.xMin - (2 * Settings.borderThickness)).setHeight(guiConfig.yMax - guiConfig.yMin - (2 * Settings.borderThickness)).setOutline(cc(Settings.shadowColor), Settings.shadowThickness);
	yellowConfigOutline.setX(guiConfig.xMin - 3).setY(guiConfig.yMin - 3).setWidth(guiConfig.xMax - guiConfig.xMin + 6).setHeight(guiConfig.yMax - guiConfig.yMin + 6);
	textAlignX = guiConfig.xMin + 17;
	configSquare1.setX(guiConfig.xMin - 6).setY(guiConfig.yMin - 6);
	configSquare2.setX(guiConfig.xMin - 6).setY(guiConfig.yMax);
	configSquare3.setX(guiConfig.xMax).setY(guiConfig.yMax);
	configSquare4.setX(guiConfig.xMax).setY(guiConfig.yMin - 6);
	cs1Cx = guiConfig.xMin - 3; cslCy = guiConfig.yMin - 3;
	cs2Cx = guiConfig.xMin - 3; cs2Cy = guiConfig.yMax + 3;
	cs3Cx = guiConfig.xMax + 3; cs3Cy = guiConfig.yMax + 3;
	cs4Cx = guiConfig.xMax + 3; cs4Cy = guiConfig.yMin - 3;
}

//updates the overlay when a user changes a setting in the Vigilance menu
Settings.registerListener("Border Thickness", () => reloadOverlayPos());
Settings.registerListener("Shadow Thickness", () => reloadOverlayPos());
Settings.registerListener("Border Color", () => reloadOverlayPos());
Settings.registerListener("Shadow Color", () => reloadOverlayPos());
Settings.registerListener("Main Color", () => reloadOverlayPos());
Settings.registerListener("Text Shadow", () => reloadOverlayPos());

//When the game renders a gui, render the overlay if it is enabled and the player has hovered over a party in party finder
register("guiRender", (mx, my, gui) => {
	if (shouldDrawOverlay && Settings.overlayEnabled) {
		renderThingy(false);
	}
});

//Used to calculate the distance between two points, specifically to determine if the user has clicked on a button while repositioning the overlay
function distance(x1, y1, x2, y2) {
	return Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
}

//a gui that opens while the user is repositioning the overlay
const editGui = new Gui();
editGui.registerDraw(() => renderThingy(true));

//Detect when a button in the overlay editor is clicked and determine which one it was
let buttonSelected = 0;
editGui.registerClicked((mx, my, mb) => {
	if (distance(mx, my, cs1Cx, cslCy) < 4) {
		buttonSelected = 1;
	} else if (distance(mx, my, cs2Cx, cs2Cy) < 4) {
		buttonSelected = 2;
	} else if (distance(mx, my, cs3Cx, cs3Cy) < 4) {
		buttonSelected = 3;
	} else if (distance(mx, my, cs4Cx, cs4Cy) < 4) {
		buttonSelected = 4;
	} else {
		buttonSelected = 0;
	}
});

//Detect when the user presses an arrow key and adjust the overlay accordingly
editGui.registerKeyTyped((key, keyCode) => {
	//Move in smaller increments when the user is holding shift
	const changeAmt = editGui.isShiftDown() ? 1 : 5;
	switch (buttonSelected) {
		case 1:
			switch (keyCode) {
				case 200:
					guiConfig.yMin -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 203:
					guiConfig.xMin -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 208:
					guiConfig.yMin += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 205:
					guiConfig.xMin += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
			}
			break;
		case 2:
			switch (keyCode) {
				case 200:
					guiConfig.yMax -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 203:
					guiConfig.xMin -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 208:
					guiConfig.yMax += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 205:
					guiConfig.xMin += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
			}
			break;
		case 3:
			switch (keyCode) {
				case 200:
					guiConfig.yMax -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 203:
					guiConfig.xMax -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 208:
					guiConfig.yMax += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 205:
					guiConfig.xMax += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
			}
			break;
		case 4:
			switch (keyCode) {
				case 200:
					guiConfig.yMin -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 203:
					guiConfig.xMax -= changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 208:
					guiConfig.yMin += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
				case 205:
					guiConfig.xMax += changeAmt;
					guiConfig.save();
					reloadOverlayPos();
					break;
			}
			break;
		case 0:
			break;
	}
});

//Text lines in the overlay
const plText = new Text(`${darkColor}Party Leader: ${pLeaderFormatted}`, textAlignX, guiConfig.yMin + 25).setShadow(Settings.textShadow);
const dftText = new Text(`${darkColor}Floor:${lightColor} ${dType} ${dFloor}`, textAlignX, guiConfig.yMin + 40).setShadow(Settings.textShadow);
const dnText = new Text(`${darkColor}Note:${lightColor} ${dNote}`, textAlignX, guiConfig.yMin + 55).setShadow(Settings.textShadow);
const reqText = new Text(`${darkColor}Requirements:`, textAlignX, guiConfig.yMin + 70).setShadow(Settings.textShadow);
const clrText = new Text(`${lightColor} Class Level ${emphasisColor}${classLevelReq}`, textAlignX, guiConfig.yMin + 80).setShadow(Settings.textShadow);
const dlrText = new Text(`${lightColor} Cata Level ${emphasisColor}${dLevelReq}`, textAlignX, guiConfig.yMin + 90).setShadow(Settings.textShadow);
const mnText = new Text(`${darkColor}Members ${emphasisColor}(${memberList.length})${darkColor}:`, textAlignX, guiConfig.yMin + 105).setShadow(Settings.textShadow);

const levelLines = [
	new Text("", textAlignX, guiConfig.yMin + 115).setShadow(Settings.textShadow),
	new Text("", textAlignX, guiConfig.yMin + 125).setShadow(Settings.textShadow),
	new Text("", textAlignX, guiConfig.yMin + 135).setShadow(Settings.textShadow),
	new Text("", textAlignX, guiConfig.yMin + 145).setShadow(Settings.textShadow)
];

let requestedPlayers = [];

//Function to render the actual overlay
//configMode determines whether to render the overlay with the repositioning tools
function renderThingy(configMode) {

	const emptyLineCount = 4 - memberList.length;
	for(let i = 0; i < emptyLineCount; i++) {
		levelLines[3-i].setString("");
	}

	if (configMode) {
		yellowConfigOutline.draw();
		inventoryBox.draw();
		line1.draw();
		line2.draw();
		line3.draw();
		line4.draw();
		line5.draw();
		line6.draw();
		line7.draw();
	}
	border.draw();
	base.draw();
	if (configMode) {
		configSquare1.draw();
		configSquare2.draw();
		configSquare3.draw();
		configSquare4.draw();
	}

	plText.setString(`${darkColor}Party Leader: ${pLeaderFormatted}`).setX(textAlignX).setY(guiConfig.yMin + 25).setShadow(Settings.textShadow).draw();
	dftText.setString(`${darkColor}Floor:${lightColor} ${dType} ${dFloor}`).setX(textAlignX).setY(guiConfig.yMin + 40).setShadow(Settings.textShadow).draw();
	dnText.setString(`${darkColor}Note:${lightColor} ${dNote}`).setX(textAlignX).setY(guiConfig.yMin + 55).setShadow(Settings.textShadow).draw();
	reqText.setString(`${darkColor}Requirements:`).setX(textAlignX).setY(guiConfig.yMin + 70).setShadow(Settings.textShadow).draw();
	clrText.setString(`${lightColor} Class Level ${emphasisColor}${classLevelReq}`).setX(textAlignX).setY(guiConfig.yMin + 80).setShadow(Settings.textShadow).draw();
	dlrText.setString(`${lightColor} Cata Level ${emphasisColor}${dLevelReq}`).setX(textAlignX).setY(guiConfig.yMin + 90).setShadow(Settings.textShadow).draw();
	mnText.setString(`${darkColor}Members ${emphasisColor}(${memberList.length})${darkColor}:`).setX(textAlignX).setY(guiConfig.yMin + 105).setShadow(Settings.textShadow).draw();
	//loop through all the party members, attempt to pull their cata level from the ones already saved
	for (let i = 0; i < memberList.length; i++) {	
		if(isPlayerStored(memberList[i].name)) {
			let cataData = retrieveFromSaved(memberList[i].name);
			levelLines[i].setString(` ${lightColor}${memberList[i].name}: ${emphasisColor}${memberList[i].classType} ${memberList[i].classLevel}, Cata ${cataData.catacombsLevel}`).setShadow(Settings.textShadow).draw();
		}else{
			levelLines[i].setString(` ${lightColor}${memberList[i].name}: ${emphasisColor}${memberList[i].classType} ${memberList[i].classLevel}`).setShadow(Settings.textShadow).draw();

			if(!requestedPlayers.includes(memberList[i].name)) {
				requestedPlayers.push(memberList[i].name);
				getCataData(memberList[i].name).then(function(cataData) {
					//remove player form requestedPlayers as they are no longer being requested
					requestedPlayers.splice(requestedPlayers.indexOf(cataData.name), 1);
				}).catch((error) => {
					if(Object.keys(error).includes("error") && error["error"] == "Internal Service Error") {
						ChatLib.chat(`${prefix} Mojang API Error`);
					}else{
						console.log(error);
						console.log(error.stack);
					}
				});
			}
		}
	}
}

//when the user closes the gui you shouldn't render the overlay anymore and no more players are being requested
register("guiClosed", () => {
	shouldDrawOverlay = false;
	requestedPlayers = [];
});

//listen for api key messages
register("chat", (newKey, e) => {
	Settings.apiKey = newKey;
	ChatLib.chat(`${prefix} Saved your new api key as: ${newKey}`);
}).setCriteria("Your new API key is ${newKey}");

//validate api key
register("worldLoad", () => {
	request(`https://api.hypixel.net/key?key=${Settings.apiKey}`).catch((error) => ChatLib.chat(`${prefix} It appears your api key is invalid. Please generate a new one by doing ${emphasisColor}/api new`));
});

function displayHelpMsg() {
	ChatLib.chat(`${prefix} Base command: ${emphasisColor}/catahover, /chover, /cho`);
	ChatLib.chat(new TextComponent(` §7> ${lightColor}/cho ${emphasisColor}<player1> [player2] ...`).setHoverValue("Finds the catacombs and class level(s) of the specified player(s)"));
	ChatLib.chat(new TextComponent(` §7> ${lightColor}/cho party`).setHoverValue("Finds the catacombs and class levels of the players in your party"));
	ChatLib.chat(new TextComponent(` §7> ${lightColor}/cho settings`).setHoverValue("Set your api key and change the appearance of the party finder overlay"));
	ChatLib.chat(new TextComponent(` §7> ${lightColor}/cho gui`).setHoverValue("Change the location of the party finder overlay on the screen"));
}

//Allows the /chover party command register to communicate with the chat register for detecting party events
let listeningForParty = false;

//Define main command for the module
let mainCommand = register("command", (...args) => {
	if (args[0] == null) {
		//If there aren't any arguments, display the help message
		displayHelpMsg();
	} else if (args[0] == "help") {
		//Player has used help option
		displayHelpMsg();
	} else if (args[0] == "party") {
		//Player has used party option
		getPartyMembers(false).then((memberArray) => {
			if (memberArray.length == 0) {
				ChatLib.chat(`${prefix} No players in your party to check`);
			} else {
				ChatLib.chat(`${prefix} Checking ${emphasisColor}${args.length} ${lightColor}party members`);
				for(let playerName of memberArray) {
					checkPlayer(playerName);
				}
			}
		}).catch((error) => ChatLib.chat(error));
	} else if (args[0] == "settings") {
		//Player has selected option to open Vigilance settings
		Settings.openGUI();
	} else if (args[0] == "gui") {
		//Player has selected option to open the edit gui, primary purpose is for config.js to be able to open with button
		editGui.open();
	} else {
		//No specific args so we assume they are players
		//Send out header line
		ChatLib.chat(`${prefix} Checking ${emphasisColor}${args.length} ${lightColor}player(s):`);
		//Loop through all the players and check the cata level of each one
		for (player of args) {
			checkPlayer(player);
		}
	}
}).setTabCompletions((args) => {
	let baseOptions = ["help", "party", "settings", "gui"];
	let playerList = World.getAllPlayers().map((p) => p.getName()).sort();
	let maxArgsIndex = args.length - 1;
	let possibleCompletions = baseOptions.concat(playerList).filter((n) => {
		return n.toLowerCase().startsWith(args[maxArgsIndex].toLowerCase());
	});
	return possibleCompletions;
}).setName("catahover").setAliases("chover", "cho");

register("chat", (playerName, className, classLevel, e) => {
	if (!Settings.editJoinMsg) {
		return;
	}
	cancel(e);
	let formattedMessage = ChatLib.getChatMessage(e, true);
	const msgId = Math.floor(Math.random() * 100) + 11000;
	let msgToEdit = new Message(formattedMessage).setChatLineId(msgId);
	msgToEdit.chat();

	getCataData(playerName).then((cataData) => {
		let newMessage = new Message(`${formattedMessage} §e(§bCata Level ${cataData.catacombsLevel}§e)`).setChatLineId(msgId);
		ChatLib.chat(newMessage);
	}).catch((error) => ChatLib.chat(error));
}).setCriteria("Dungeon Finder > ${playerName} joined the dungeon group! (${className} Level ${classLevel})");

//puts the cata level of the player in chat
function checkPlayer(playerName) {
	const msgId = Math.floor(Math.random() * 100) + 10000;
	const msg = new Message(`§7> ${lightColor}${playerName}§7:`).setChatLineId(msgId).chat();
	getCataData(playerName).then((cataData) => {
		ChatLib.chat(new Message(`§7> ${lightColor}${playerName}§7: ${lightColor}${cataData.selectedClassName.charAt(0).toUpperCase() + cataData.selectedClassName.slice(1)} ${cataData.selectedClassLevel}§7, ${lightColor}Cata ${cataData.catacombsLevel}`).setChatLineId(msgId));
	}).catch((error) => ChatLib.chat(error));
}

//color converter java.awt.Color => Renderer.color
function cc(color) {
	return Renderer.color(color.getRed(), color.getGreen(), color.getBlue(), color.getAlpha());
}

