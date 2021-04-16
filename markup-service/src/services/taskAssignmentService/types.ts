import { Appointment } from "../../entity/Appointment";
import { Markup } from "../../entity/Markup";
import { User } from "../../entity/User";

export type TaskFetcher = (markup: Markup, user: User) => Promise<Appointment | null>;

export type TaskRandomFetcher = {
    fetchTask: () => Promise<Appointment | null>,
    probability: number
};
