import { Update, EventOptions, EventType, EventStatus } from "./types.js";


export default class Event {
    id: number;
    url: string;
    type: EventType;
    status: EventStatus;
    servicesImpacted: string[];
    date: string;
    startTime: string;
    endTime: string;
    description: string[];
    impactAnalysis: string;
    updates: Update[];

    constructor(eventOptions: EventOptions = {}) {
        this.id = eventOptions.id ?? -1;
        this.url = eventOptions.url ?? "";
        this.type = eventOptions.type ?? "";
        this.status = eventOptions.status ?? "";
        this.servicesImpacted = eventOptions.servicesImpacted ?? [];
        this.date = eventOptions.date ?? "";
        this.startTime = eventOptions.startTime ?? "";
        this.endTime = eventOptions.endTime ?? "";
        this.description = eventOptions.description ?? [];
        this.impactAnalysis = eventOptions.impactAnalysis ?? "";
        this.updates = eventOptions.updates ?? [];
    }

    static isEqual(a: Event, b: Event): boolean {
        return (
            a.id === b.id &&
            a.url === b.url &&
            a.type === b.type &&
            a.status === b.status &&
            a.servicesImpacted.length === b.servicesImpacted.length &&
            a.date === b.date &&
            a.startTime === b.startTime &&
            a.endTime  === b.endTime  &&
            a.description.length === b.description.length &&
            a.impactAnalysis === b.impactAnalysis &&
            a.updates.length === b.updates.length
        );
    }
}
