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
    "closed" = ":white_check_mark: Closed",
};

const UPDATE_MS = 60000; // milliseconds

const USERNAME = "Binghamton University System Status Dashboard";
const AVATAR_URL = "https://bl3301files.storage.live.com/y4mkHqRjSol7dTzP2USr_xk9OHMHxqVljfW3MBYHpP69M_o2A_-T4HoimlQ8Ve0Kfjyg6dcHxFq_LSzmB6ImpW978M8rzY6XiOJ77mc8sRcA4vHNssa_8L31ZcSugSn5UYSEwYAJ8qw59vjLFku75QKH_qLTWWrYdle2nSRbLnDJD7M_xFPqe27csc6foHsMTIriLQgKEUQJyBC8mEePMKs4g/bingits.png?psid=1&width=512&height=512&cropMode=center";
const COLOR = 0x6CC24A;

const MESSAGE_CONTENT = `:warning: New message from from the [System Status Dashboard](${ORIGIN_URL}):`;
const MESSAGE_DELAY_MS = 10000; // milliseconds

let client: WebhookClient;
let lastEventId: number;


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

    let index = binarySearch(lastEventId, events.map(o => o.id));
    if (index >= 0) {
        let newEvents = events.slice(0, index);
        if (newEvents.length > 0) {
            onNewEvents(newEvents);
            lastEventId = newEvents[0].id;
        }
    }
}

async function createMessageEmbed(event: Event): Promise<MessageEmbed> {
    let {id, url, date, type, status, description} = event;
    let { servicesImpacted, startTime, endTime } = await Scraper.getEventDetails(url);

    let options = {
        title: getText(type),
        url,
        description,
        timestamp: new Date(date),
        color: COLOR,
        fields: [
            {
                name: "Services impacted: ",
                value: servicesImpacted.join("\n"),
                inline: true
            },
            {
                name: "Status: ",
                value: getText(status),
                inline: true
            }
        ]
    };

    let embed = new MessageEmbed(options);
    return embed;
}

async function onNewEvents(events: Event[]) {
    console.log(events.length + " new events!");
    console.log(JSON.stringify(events));

    for (let i = events.length - 1; i >= 0; i--) {
        let embed = await createMessageEmbed(events[i]);

        setTimeout(() => {
            client.send({
                content: MESSAGE_CONTENT,
                username: USERNAME,
                avatarURL: AVATAR_URL,
                embeds: [embed]
            });
        }, MESSAGE_DELAY_MS * (events.length - i - 1));
    }
}

function start() {
    let { DISCORD_WEBHOOK_URL } = process.env;
    if (DISCORD_WEBHOOK_URL === undefined) {
        throw new Error("The environment variable DISCORD_WEBHOOK_URL is not defined.");
    }

    client = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
    lastEventId = 263;

    setInterval(checkForUpdates, UPDATE_MS);
    checkForUpdates();
}

start();
