import { ProcessStore } from "./processStore";

describe("processStore", () => {
    const markupId = "markup_1";

    it("Not ready to start trainig when recieved less than 3 new markup items", () => {
        const processStore = new ProcessStore({
            markupItemsBetweenTraining: 3
        });
        expect(processStore.isReadyToStartTraining(markupId)).toBeFalsy();
        for (let i = 0; i < 2; ++i) {
            processStore.handleMarkupItemCreated(markupId);
            expect(processStore.isReadyToStartTraining(markupId)).toBeFalsy();
        }
    });

    it("Ready to start training after recieving 3 new markup items", () => {
        const processStore = new ProcessStore({
            markupItemsBetweenTraining: 3
        });
        for (let i = 0; i < 3; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        expect(processStore.isReadyToStartTraining(markupId)).toBeTruthy();
    });

    it("Is not ready to start training when training is already started", () => {
        const processStore = new ProcessStore({
            markupItemsBetweenTraining: 3
        });
        for (let i = 0; i < 3; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        processStore.handleStartTraining(markupId);
        expect(processStore.isReadyToStartTraining(markupId)).toBeFalsy();
    });

    it("Is not ready to start training even if recieved 5 new markup items", () => {
        const processStore = new ProcessStore({
            markupItemsBetweenTraining: 3
        });
        for (let i = 0; i < 3; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        processStore.handleStartTraining(markupId);
        for (let i = 0; i < 5; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        expect(processStore.isReadyToStartTraining(markupId)).toBeFalsy();
    });

    it("It is ready start training after recieving 5 new markup items, when training, and after finishing training", () => {
        const processStore = new ProcessStore({
            markupItemsBetweenTraining: 3
        });
        for (let i = 0; i < 3; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        processStore.handleStartTraining(markupId);
        for (let i = 0; i < 5; ++i) {
            processStore.handleMarkupItemCreated(markupId);
        }
        processStore.handleFinishTraining(markupId);
        expect(processStore.isReadyToStartTraining(markupId)).toBeTruthy();
    });
});
