import React from "react";
import "./style.scss";

type Props = {
    rect: {
        x1: number,
        y1: number,
        x2: number,
        y2: number
    },
    className?: string,
    onClose?: () => void
}

export default function RectFrame({ rect, className, onClose }: Props) {
    const left = `${Math.min(rect.x1, rect.x2)}px`;
    const top = `${Math.min(rect.y1, rect.y2)}px`;
    const width = `${Math.abs(rect.x1 - rect.x2)}px`;
    const height = `${Math.abs(rect.y1 - rect.y2)}px`;

    const onClickClose = (ev: React.MouseEvent<HTMLDivElement>) => {
        if (!onClose) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        onClose();
    }

    return <div
        className={`rect-frame ${className || ""}`}
        style={{ left, top, width, height }}
    >
        {
            onClose &&
            <div className="rect-frame__remove-btn" onMouseDown={onClickClose} />
        }
    </div>;
}
