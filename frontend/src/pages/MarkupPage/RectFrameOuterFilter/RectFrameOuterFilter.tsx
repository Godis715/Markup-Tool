import React from "react";
import "./style.scss";

type Props = {
    rect:{
        x1: number,
        y1: number,
        x2: number,
        y2: number
    },
    className?: string
}

export default function RectFrameOuterFilter({ rect, className }: Props) {
    const left = `${Math.min(rect.x1, rect.x2)}px`;
    const top = `${Math.min(rect.y1, rect.y2)}px`;
    const width = `${Math.abs(rect.x1 - rect.x2)}px`;
    const height = `${Math.abs(rect.y1 - rect.y2)}px`;

    return <div
        className={`rect-frame-outer-filter ${className || ""}`}
        style={{
            // @ts-ignore
            "--left": left,
            "--top": top,
            "--width": width,
            "--height": height
        }}
    />;
}
