import { playRandomIndex } from "./taskAssignmentService";

test("Play random index: [0, 1]", () => {
    const probab = [0, 1];
    expect(playRandomIndex(probab)).toEqual(1);
});

test("Play random index: [1, 0]", () => {
    const probab = [1, 0];
    expect(playRandomIndex(probab)).toEqual(0);
});

test("Play random index: should not return values with 0 probab", () => {
    const probab = [0.2, 0, 0.3, 0, 0.5];
    const results = Array(100).fill(0).map(() => playRandomIndex(probab));

    expect(results).not.toContain(1);
    expect(results).not.toContain(3);
});
