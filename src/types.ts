export interface Product {
    id: number;
    name: string;
    price: string;
    volume: number;
    temp: number;
    life: number;
    image: string;
}

export interface ChatMessage {
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export interface UserState {
    name: string;
    credits: number;
    roles: {
        client: boolean;
        driver: boolean;
        vendor: boolean;
    };
    driverDetails?: {
        callsign: string;
        registryId: string;
    };
}
