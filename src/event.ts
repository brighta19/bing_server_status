import { Update, EventOptions, EventType, EventStatus } from "./types.js";


export default class Event {
    id: number;
    url: string;
    type: EventType | null;
    status: EventStatus | null;
    servicesImpacted: string[];
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    impactAnalysis: string;
    updates: Update[];

    constructor(eventOptions: EventOptions = {}) {
        this.id = eventOptions.id ?? -1;
        this.url = eventOptions.url ?? "";
        this.type = eventOptions.type ?? null;
        this.status = eventOptions.status ?? null;
        this.servicesImpacted = eventOptions.servicesImpacted ?? [];
        this.date = eventOptions.date ?? "";
        this.startTime = eventOptions.startTime ?? "";
        this.endTime = eventOptions.endTime ?? "";
        this.description = eventOptions.description ?? "";
        this.impactAnalysis = eventOptions.impactAnalysis ?? "";
        this.updates = eventOptions.updates ?? [];
    }
}
