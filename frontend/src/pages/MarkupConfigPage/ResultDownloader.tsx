import React, { useState } from "react";
import Button from "react-bootstrap/esm/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { downloadMarkupResult } from "../../remote/api";

type Props = {
    markupId: string,
    className?: string,
    disabled?: boolean
}

type ResultExtension = "json"|"csv"|"yolo";

const EXTENSIONS: ResultExtension[] = ["json", "csv", "yolo"];

export default function ResultDownloader(props: Props): JSX.Element {
    const [extension, setExtension] = useState<ResultExtension>("json");

    const onExtensionChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setExtension(ev.target.value as ResultExtension);
    };

    const onDownloadClick = async () => {
        const result = await downloadMarkupResult(props.markupId, extension);
        if (!result.isSuccess) {
            console.error(result.error);
        }
    };

    return <InputGroup style={{ width: "fit-content" }} className={props.className}>
        <InputGroup.Prepend>
            <Button onClick={onDownloadClick} disabled={props.disabled}>Скачать разметку</Button>
        </InputGroup.Prepend>
        <Form.Control as="select" onChange={onExtensionChange} value={extension}>
            {
                EXTENSIONS.map(
                    (ext) => <option key={ext} value={ext}>{ext}</option>
                )
            }
        </Form.Control>
    </InputGroup>;
}
