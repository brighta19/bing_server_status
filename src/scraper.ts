// @ts-nocheck - cheerio's types are missing some stuff, so this is my solution. Be cautious!

import cheerio from "cheerio";
import fetch from "node-fetch";
import Event from "./event.js";
import { EventOptions, Update } from "./types.js";
import { ORIGIN_URL, BING_EVENTS_URL } from "./constants.js";

export const Scraper = {
    async getServices(): Promise<Map<string, string>> {
        let services = new Map<string, string>();

        let result = await fetch(ORIGIN_URL);
        let html = await result.text();

        let $ = cheerio.load(html);
        let tbody = $("tbody")[0];

        let rows = tbody.children.filter(node => node.type === "tag" && node.name === "tr");

        for (let i = 1; i < rows.length; i++) {
            let cells: Node[] = rows[i].children.filter(node => node.type === "tag" && node.name === "td");

            let span1 = cells[1].children.find(node => node.type === "tag" && node.name === "span");
            let service = span1.children[0].data.trim();

            let span2 = cells[0].children.find(node => node.type === "tag" && node.name === "span");
            let status = span2.attribs.title;

            services.set(service, status);
        }

        return services;
    },

    async getRecentEvents(): Promise<Event[]> {
        let recentEvents: Event[] = [];

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

            let id = div.children[1].children[0].attribs.href.match(/id=(\d+)/)[1];
            let url = ORIGIN_URL + div.children[1].children[0].attribs.href;
            let date = div.children[1].children[0].children[0].data.trim();
            let type = div.children[3].children[1].data.trim();
            // let status = div.children[5].children[1].data.trim();
            // let description = [ div.children[7].children[1].data.trim() ];

            let result = await fetch(url);
            let html = await result.text();
            let $ = cheerio.load(html);

            let tbody = $("tbody")[0];
            let details = tbody.children;

            let status = details[1].children[3].children[1].children[0].data.trim();
            let servicesImpacted = details[3].children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim());
            let startTime = details[5].children[3].children[0].data.trim();
            let endTime = details[7].children[3].children[0]?.data.trim() || "";
            let description = details[9].children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim());

            let impactAnalysis: string = "";
            if (type === "maintenance")
                impactAnalysis = details[11].children[3].children[0].data.trim();

            let updates: Update[] = [];
            let tbody2 = $("tbody")[1];
            if (tbody2 !== undefined) {
                updates = tbody2.children.filter(n => n.type === "tag" && n.name === "tr").map(n => {
                    return {
                        time: n.children[1].children[0].data.trim(),
                        details: n.children[3].children.filter(n => n.type === "text" && n.data.trim() !== "").map(n => n.data.trim())
                    };
                });
            }

            let event = new Event({
                id,
                url,
                date,
                type,
                status,
                servicesImpacted,
                startTime,
                endTime,
                description,
                impactAnalysis,
                updates
            });

            recentEvents.push(event);
        }

        return recentEvents;
    }
};
