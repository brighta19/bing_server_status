type Update = {
    time: string;
    details: string[]
};

type EventType = "" | "maintenance" | "incident";

type EventStatus = "" | "planning" | "completed" | "open" | "closed";

type EventOptions = {
    id?: number;
    url?: string;
    type?: EventType;
    status?: EventStatus;
    servicesImpacted?: string[];
    date?: string;
    startTime?: string;
    endTime?: string;
    description?: string[];
    impactAnalysis?: string;
    updates?: Update[]
};

export { Update, EventOptions, EventType, EventStatus };
