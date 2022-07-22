import Promise from "../PromiseV2";

export default function getPartyMembers(deletePartyMessages) {
    ChatLib.command("party list", false);
    return new Promise((resolve) => {
        let partyMessageStarted = false;
        let members = [];
        let trigger = register("chat", (e) => {
            const message = ChatLib.getChatMessage(e).removeFormatting();

            //Regex objects for pulling information from different parts of the /p list message
            const lineBreakRE = /-{8,}/;
            const noPartyRE = /^You are not currently in a party.$/;
            const headerRE = /^Party Members \((\d+)\)$/;
            const partyLeaderRE = /^Party Leader: (?:\[\w{3}\+{0,2}\] )?(\w{3,})/;
            const blankLineRE = /^$/;
            const partyModsLineRE = /^Party Moderators: (.+)/;
            const partyModRE = /(?:\[\w{3}\+{0,2}\] )?(\w+)/g;
            const partyMembersLineRE = /^Party Members: (.+)/;
            const partyMemberRE = /(?:\[\w{3}\+{0,2}\] )?(\w+)/g;

            //For each line of the message, check the listed player(s) if any and remove the line by cancelling the event
            if (!partyMessageStarted && lineBreakRE.test(message)) {
                partyMessageStarted = true;
                !deletePartyMessages && cancel(e);
            } else if (partyMessageStarted && noPartyRE.test(message)) {
                !deletePartyMessages && cancel(e);
            } else if (partyMessageStarted && headerRE.test(message)) {
                !deletePartyMessages && cancel(e);
            } else if (partyMessageStarted && blankLineRE.test(message)) {
                !deletePartyMessages && cancel(e);
            } else if (partyMessageStarted && partyLeaderRE.test(message)) {
                !deletePartyMessages && cancel(e);
                const leaderName = partyLeaderRE.exec(message)[1];
                members.push(leaderName);
            } else if (partyMessageStarted && partyModsLineRE.test(message)) {
                !deletePartyMessages && cancel(e);
                const modString = partyModsLineRE.exec(message)[1];
                let iterating = true;
                while (iterating) {
                    let out = partyModRE.exec(memberString);
                    iterating = (out != null);
                    if (out != null) {
                        let modName = out[1];
                        members.push(leaderName);
                    }
                }
            } else if (partyMessageStarted && partyMembersLineRE.test(message)) {
                !deletePartyMessages && cancel(e);
                const memberString = partyMembersLineRE.exec(message)[1];
                let iterating = true;
                while (iterating) {
                    let out = partyMemberRE.exec(memberString);
                    iterating = (out != null);
                    if (out != null) {
                        let memberName = out[1];
                        members.push(memberName);
                    }
                }
            } else if (partyMessageStarted && lineBreakRE.test(message)) {
                !deletePartyMessages && cancel(e);
                trigger.unregister();
                resolve(members);
            }
        });
    });
}


