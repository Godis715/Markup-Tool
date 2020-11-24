import React from "react";
import "./style.scss";

type Props = {
    rect: {
        x1: number,
        y1: number,
        x2: number,
        y2: number
    },
    scale?: number,
    color: string,
    className?: string,
    onClose?: () => void
}

export default function RectFrame({ rect, scale, className, color, onClose }: Props): JSX.Element {
    const k = scale !== undefined ? scale : 1;
    const left = `${Math.min(rect.x1, rect.x2) * k}px`;
    const top = `${Math.min(rect.y1, rect.y2) * k}px`;
    const width = `${Math.abs(rect.x1 - rect.x2) * k}px`;
    const height = `${Math.abs(rect.y1 - rect.y2) * k}px`;

    const onClickClose = (ev: React.MouseEvent<HTMLDivElement>) => {
        if (!onClose) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        onClose();
    };

    return <div
        className={`rect-frame ${className || ""}`}
        // @ts-ignore
        style={{ left, top, width, height, "--color": color }}
    >
        {
            onClose &&
            <div className="rect-frame__remove-btn" onMouseDown={onClickClose} />
        }
    </div>;
}

RectFrame.defaultProps = {
    scale: 1
};
