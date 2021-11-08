import fetch from "node-fetch";
import cheerio from "cheerio";
import { WebhookClient, MessageEmbed } from "discord.js";

const EventType = {
    "maintenance": "Scheduled Maintenance",
    "incident": "New Incident",
};
const EventStatus = {
    "planning": ":clock4: Planning",
    "completed": ":white_check_mark: Completed",
    "closed": ":white_check_mark: Closed",
};

const ORIGIN_URL = "https://itstatus.binghamton.edu:8443";
const BING_EVENTS_URL = "https://itstatus.binghamton.edu:8443/search/events";
const UPDATE_MS = 60000; // milliseconds

const USERNAME = "Binghamton University System Status Dashboard";
const AVATAR_URL = "https://bl3301files.storage.live.com/y4mkHqRjSol7dTzP2USr_xk9OHMHxqVljfW3MBYHpP69M_o2A_-T4HoimlQ8Ve0Kfjyg6dcHxFq_LSzmB6ImpW978M8rzY6XiOJ77mc8sRcA4vHNssa_8L31ZcSugSn5UYSEwYAJ8qw59vjLFku75QKH_qLTWWrYdle2nSRbLnDJD7M_xFPqe27csc6foHsMTIriLQgKEUQJyBC8mEePMKs4g/bingits.png?psid=1&width=512&height=512&cropMode=center";
const COLOR = 0x6CC24A;

const MESSAGE_CONTENT = `:warning: New message from from the [System Status Dashboard](${ORIGIN_URL}):`;
const MESSAGE_DELAY_MS = 10000; // milliseconds

const client = new WebhookClient({ url: "YOUR_WEBHOOK_URL" });

let lastEventId = 263;


// When will I use this, I wonder.
async function getServices() {
    let services = new Map();

    let result = await fetch(ORIGIN_URL);
    let html = await result.text();

    let $ = cheerio.load(html);
    let tbody = $("tbody")[0];
    let rows = tbody.children.filter(node => node.type === "tag" && node.name === "tr");

    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].children.filter(node => node.type === "tag" && node.name === "td");

        let span1 = cells[1].children.find(node => node.type === "tag" && node.name === "span");
        let service = span1.children[0].data.trim();

        let span2 = cells[0].children.find(node => node.type === "tag" && node.name === "span");
        let status = span2.attribs.title;

        services.set(service, {
            status: status === "Service is operating normally.",
            statusText: status
        });
    }

    return services;
}

async function getRecentEvents() {
    let recentEvents = [];

    let result = await fetch(BING_EVENTS_URL);
    let html = await result.text();
    let $ = cheerio.load(html);

    let body = $("body")[0];
    let divs = body.children.filter(child => {
        return child.type === "tag"
            && child.name === "div"
            && child.attribs.class === "row";
    });

    const numOfEventsOnPage = 10;
    for (let i = 5; i < numOfEventsOnPage + 5; i++) {
        let div = divs[i].children[1];

        recentEvents.push({
            id: div.children[1].children[0].attribs.href.match(/id=(\d+)/)[1],
            url: ORIGIN_URL + div.children[1].children[0].attribs.href,
            date: div.children[1].children[0].children[0].data.trim(),
            type: div.children[3].children[1].data.trim(),
            status: div.children[5].children[1].data.trim(),
            description: div.children[7].children[1].data.trim()
        });
    }

    return recentEvents;
}

async function getEventDetails(eventURL) {
    let result = await fetch(eventURL);
    let html = await result.text();
    let $ = cheerio.load(html);

    let type = "unknown";
    if (eventURL.indexOf("i_detail") >= 0)
        type = "incident";
    else if (eventURL.indexOf("m_detail") >= 0)
        type = "maintenance";

    // Details table
    let tbody = $("tbody")[0];
    let details = tbody.children;

    let eventDetails = {
        type,
        status: details[1].children[3].children[1].children[0].data.trim(),
        servicesImpacted: details[3].children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim()),
        startTime: details[5].children[3].children[0].data.trim(),
        endTime: details[7].children[3].children[0].data.trim(),
        description: details[9].children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim()),
    };

    if (type === "maintenance")
        eventDetails.impactAnalysis = details[11].children[3].children[0].data.trim();

    // Update table
    let tbody2 = $("tbody")[1];
    if (tbody2 !== undefined) {
        eventDetails.updates = tbody2.children.filter(n => n.type === "tag" && n.name === "tr").map(n => {
            return {
                time: n.children[1].children[0].data.trim(),
                details: n.children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim())
            };
        });
    }

    return eventDetails;
}

function binarySearch(key, array, startingIndex = 0) {
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

async function update() {
    let events = await getRecentEvents();

    let index = binarySearch(lastEventId, events.map(o => o.id));
    if (index >= 0) {
        let newEvents = events.slice(0, index);
        if (newEvents.length > 0) {
            onNewEvents(newEvents);
            lastEventId = newEvents[0].id;
        }
    }
}

async function onNewEvents(events) {
    console.log(events.length + " new events!");
    console.log(JSON.stringify(events));

    for (let i = events.length - 1; i >= 0; i--) {
        let {id, url, date, type, status, description} = events[i];
        let {type2, status2, servicesImpacted, startTime, endTime, description2} = await getEventDetails(url);

        setTimeout(() => {
            client.send({
                content: MESSAGE_CONTENT,
                username: USERNAME,
                avatarURL: AVATAR_URL,
                embeds: [
                    new MessageEmbed({
                        title: EventType[type],
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
                                value: EventStatus[status],
                                inline: true
                            }
                        ]
                    })
                ]
            });
        }, MESSAGE_DELAY_MS * (events.length - i - 1));
    }
}

setInterval(update, UPDATE_MS);
update();
