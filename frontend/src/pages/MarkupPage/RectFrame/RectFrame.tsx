import React, { useEffect } from "react";
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
    withLabel?: boolean,
    label?: string,
    onClose?: () => void,
    onLabelChange?: (label: string) => void
}

export default function RectFrame(props: Props): JSX.Element {
    const { rect, scale, className, color, withLabel, label, onClose, onLabelChange } = props;
    const k = scale !== undefined ? scale : 1;
    const left = `${Math.min(rect.x1, rect.x2) * k}px`;
    const top = `${Math.min(rect.y1, rect.y2) * k}px`;
    const width = `${Math.abs(rect.x1 - rect.x2) * k}px`;
    const height = `${Math.abs(rect.y1 - rect.y2) * k}px`;
    const labelRef = React.useRef<HTMLInputElement>(null);

    const onClickClose = (ev: React.MouseEvent<HTMLElement>) => {
        if (!onClose) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        onClose();
    };

    useEffect(() => {
        if (!labelRef.current) {
            return;
        }

        labelRef.current.focus();
    }, [labelRef]);

    const handleLabelChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (!onLabelChange) {
            return;
        }
        onLabelChange(ev.target.value);
    };

    return <div
        className={`rect-frame ${className || ""}`}
        style={{ left, top, width, height, "--color": color } as React.CSSProperties}
    >
        {
            onClose &&
            <div className="rect-frame__remove-btn" onMouseDown={onClickClose} />
        }
        {
            withLabel &&
            <input
                className="rect-frame__label"
                ref={labelRef}
                onChange={handleLabelChange}
                value={label}
                onMouseDown={(ev) => ev.stopPropagation()}
                //size={label?.length || 1}
                style={{ width: `${(label?.length || 0) + 2}ch` }}
            />
        }
    </div>;
}

RectFrame.defaultProps = {
    scale: 1
};
