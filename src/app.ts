import dotenv from "dotenv";
dotenv.config();

import { MessageEmbed, WebhookClient } from "discord.js";
import { Scraper } from "./scraper.js";
import { Update, EventType, EventStatus } from './types.js';
import Event from "./event.js";
import { ORIGIN_URL } from "./constants.js";

enum Text {
    "" = "",
    "maintenance" = "Scheduled Maintenance",
    "incident" = "New Incident",
    "planning" = ":clock4: Planning",
    "completed" = ":white_check_mark: Completed",
    "open" = ":grey_exclamation: Open",
    "closed" = ":white_check_mark: Closed",
};

const UPDATE_MS = 20000; // milliseconds

const USERNAME = "Binghamton University System Status Dashboard";
const AVATAR_URL = "https://bl3301files.storage.live.com/y4mkHqRjSol7dTzP2USr_xk9OHMHxqVljfW3MBYHpP69M_o2A_-T4HoimlQ8Ve0Kfjyg6dcHxFq_LSzmB6ImpW978M8rzY6XiOJ77mc8sRcA4vHNssa_8L31ZcSugSn5UYSEwYAJ8qw59vjLFku75QKH_qLTWWrYdle2nSRbLnDJD7M_xFPqe27csc6foHsMTIriLQgKEUQJyBC8mEePMKs4g/bingits.png?psid=1&width=512&height=512&cropMode=center";
const COLOR = 0x6CC24A;

const MESSAGE_CONTENT = `:warning: New message from from the [System Status Dashboard](${ORIGIN_URL}):`;
const MESSAGE_DELAY_MS = 10000; // milliseconds

let client: WebhookClient;
let knownEvents: Event[] = [];


function binarySearch(key: number, array: number[], startingIndex = 0): number {
    const index = Math.floor(array.length / 2);
    const mid = array[index];

    if (key == mid) {
        return startingIndex + index;
    }
    else if (array.length > 1) {
        if (key > mid) {
            return binarySearch(key, array.slice(0, index), startingIndex);
        }
        else {
            return binarySearch(key, array.slice(index + 1, array.length), startingIndex + index + 1);
        }
    }
    else {
        return -1;
    }
}

function getText(str: EventType | EventStatus | null): string {
    return Text[str ?? ""];
}

async function checkForUpdates() {
    let events = await Scraper.getRecentEvents();

    for (let i = 0; i < events.length; i++) {
        let event = events[i];

        let index = binarySearch(event.id, knownEvents.map(o => o.id));
        if (index !== -1) {
            let knownEvent = knownEvents[index];
            if ( !Event.isEqual(knownEvent, event) ) {
                console.log(`Event ${event.id} has been updated!`);
                let update = event.updates.pop();
                let updateText = "";
                if (update !== undefined) {
                    updateText = "**" + new Date(update.time) + "**\n" + update.details.join("\n");
                }

                let embed = new MessageEmbed({
                    title: getText(event.type),
                    url: event.url,
                    description: updateText,
                    timestamp: new Date(event.startTime),
                    color: COLOR,
                    fields: [
                        {
                            name: "Services impacted: ",
                            value: event.servicesImpacted.join("\n"),
                            inline: true
                        },
                        {
                            name: "Status: ",
                            value: getText(event.status),
                            inline: true
                        }
                    ]
                });

                client.send({
                    content: ":warning: New update from from the [System Status Dashboard](${ORIGIN_URL}):",
                    username: USERNAME,
                    avatarURL: AVATAR_URL,
                    embeds: [embed]
                });
            }
        }
        else {
            console.log(`Event ${event.id} has been created!`);

            let embed = new MessageEmbed({
                title: getText(event.type),
                url: event.url,
                description: event.description.join("\n"),
                timestamp: new Date(event.date),
                color: COLOR,
                fields: [
                    {
                        name: "Services impacted: ",
                        value: event.servicesImpacted.join("\n"),
                        inline: true
                    },
                    {
                        name: "Status: ",
                        value: getText(event.status),
                        inline: true
                    }
                ]
            });

            client.send({
                content: ":warning: New event from from the [System Status Dashboard](${ORIGIN_URL}):",
                username: USERNAME,
                avatarURL: AVATAR_URL,
                embeds: [embed]
            });
        }
    }

    knownEvents = events;
}

async function start() {
    let { DISCORD_WEBHOOK_URL } = process.env;
    if (DISCORD_WEBHOOK_URL === undefined) {
        throw new Error("The environment variable DISCORD_WEBHOOK_URL is not defined.");
    }

    client = new WebhookClient({ url: DISCORD_WEBHOOK_URL });

    knownEvents = await Scraper.getRecentEvents();

    setInterval(checkForUpdates, UPDATE_MS);
}

start();
