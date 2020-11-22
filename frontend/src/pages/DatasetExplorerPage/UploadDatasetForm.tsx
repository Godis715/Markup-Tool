import React, { useState } from "react";
import Form from "react-bootstrap/Form";

export default function UploadDatasetForm(): JSX.Element {
    const [cliPath, setCliPath] = useState("");
    const [datasetPath, setDatasetPath] = useState("");
    const [datasetName, setDatasetName] = useState("");

    const onCliPathChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setCliPath(ev.target.value);
    };

    const onDatasetPathChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setDatasetPath(ev.target.value);
    };

    const onDatasetNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setDatasetName(ev.target.value);
    };

    const generatedScript = `${
        cliPath !== "" ? cliPath : "<путь к утилите загрузки>"
    } upload-dataset "${
        datasetName !== "" ? datasetName : "<название датасета>"
    }" "${
        datasetPath !== "" ? datasetPath : "<путь к папке с датасетом>"
    }"`;

    return <Form>
        <Form.Group>
            <Form.Label>Путь к утилите загрузки</Form.Label>
            <Form.Control type="text" value={cliPath} onChange={onCliPathChange} />
        </Form.Group>
        <Form.Group>
            <Form.Label>Путь к папке с датасетом</Form.Label>
            <Form.Control type="text" value={datasetPath} onChange={onDatasetPathChange} />
        </Form.Group>
        <Form.Group>
            <Form.Label>Название датасета</Form.Label>
            <Form.Control type="text" value={datasetName} onChange={onDatasetNameChange} />
        </Form.Group>
        <Form.Group>
            <Form.Label>Сгенерированный скрипт</Form.Label>
            <Form.Control as="textarea" readOnly value={generatedScript} />
        </Form.Group>
    </Form>;
}
