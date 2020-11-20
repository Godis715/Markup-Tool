import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import CreatableSelect from "react-select/creatable";
import Alert from "react-bootstrap/Alert";
import { ValueType } from "react-select";
import { MarkupConfig, MarkupType } from "../../types/markup";
import { MARKUP_TYPE_LITERALS } from "../../constants/literals";

type Props = {
    show: boolean,
    onHide: () => void,
    onSubmit: (type: MarkupType, description: string, config: MarkupConfig) => void
}

enum MarkupTypeEnum {
    CLASSIFICATION = "classification",
    RECOGNITION = "recognition",
    MULTI_RECOGNITION = "multi-recognition"
}

type Option = {
    value: string,
    label: string
}

export default function CreateMarkupModal(props: Props): JSX.Element {
    const [markupType, setMarkupType] = useState<MarkupTypeEnum>(MarkupTypeEnum.CLASSIFICATION);
    const [optionInputValue, setOptionInputValue] = useState<string>("");
    const [options, setOptions] = useState<string[]>([]);
    const [objectToFind, setObjectToFind] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    const onMarkupTypeChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setMarkupType(ev.target.value as MarkupTypeEnum);
    };

    const addOption = () => {
        if (optionInputValue === "" || options.includes(optionInputValue)) {
            return;
        }

        setOptions([...options, optionInputValue.trim()]);
        setOptionInputValue("");
    };

    const onKeyDown = (ev: React.KeyboardEvent<HTMLElement>) => {
        if (ev.key === "Enter") {
            addOption();
            ev.preventDefault();
            ev.stopPropagation();
        }
    };

    const onOptionsChange = (opts: ValueType<Option>) => {
        if (!opts) {
            setOptions([]);
        }
        else if (!Array.isArray(opts)) {
            setOptions([(opts as Option).value]);
        }
        else {
            setOptions(opts.map((opt) => opt.value));
        }
    };

    const onObjectToFindChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setObjectToFind(ev.target.value);
    };

    const onSubmit = () => {
        props.onSubmit(
            markupType,
            description,
            markupType === MarkupTypeEnum.CLASSIFICATION
                ? options
                : { objectToFind }
        );
    };

    const onChangeDescription = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(ev.target.value);
    };

    return <Modal show={props.show} onHide={props.onHide} size="lg">
        <Modal.Header>
            <Modal.Title>
                Новая разметка данных
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form onSubmit={(ev) => ev.preventDefault()}>
                <Form.Group>
                    <Form.Label>Тип разметки</Form.Label>
                    <Form.Control as="select" value={markupType} onChange={onMarkupTypeChange}>
                        {
                            Object.values(MarkupTypeEnum).map(
                                (type) => <option value={type} key={type}>{MARKUP_TYPE_LITERALS[type]}</option>
                            )
                        }
                    </Form.Control>
                </Form.Group>
                {
                    markupType === MarkupTypeEnum.CLASSIFICATION &&
                    <Alert variant="secondary">
                        При данном типе разметки эксперты должны каждому изображению присвоить один из указанных классов
                    </Alert>
                }
                {
                    markupType === MarkupTypeEnum.RECOGNITION &&
                    <Alert variant="secondary">
                        При данном типе разметки эксперты должны выделить требуемый объект на изображении прямоугольной рамкой,
                        либо указать, что объект нельзя выделить
                    </Alert>
                }
                {
                    markupType === MarkupTypeEnum.MULTI_RECOGNITION &&
                    <Alert variant="secondary">
                        При данном типе разметки эксперты должны выделить все требуемые объекты на изображении, либо указать,
                        что объекты выделить нельзя
                    </Alert>
                }

                <Form.Group>
                    <Form.Label>Описание задания для экспертов</Form.Label>
                    <Form.Control
                        as="textarea"
                        value={description}
                        onChange={onChangeDescription}
                    />
                </Form.Group>

                {
                    markupType === MarkupTypeEnum.CLASSIFICATION &&
                    <Form.Group>
                        <Form.Label>Перечислите все классы изображений</Form.Label>
                        <CreatableSelect
                            className="select-container"
                            components={{ DropdownIndicator: null }}
                            isClearable
                            isMulti
                            menuIsOpen={false}
                            onInputChange={setOptionInputValue}
                            onChange={onOptionsChange}
                            value={options.map((opt) => ({ label: opt, value: opt }))}
                            onKeyDown={onKeyDown}
                            inputValue={optionInputValue}
                            placeholder="Введите название класса и нажмите Enter"
                        />
                        <Form.Text as="small" className="text-muted">Введите название класса и нажмите Enter</Form.Text>
                    </Form.Group>
                }
                {
                    (
                        markupType === MarkupTypeEnum.MULTI_RECOGNITION ||
                        markupType === MarkupTypeEnum.RECOGNITION
                    ) &&
                    <Form.Group>
                        <Form.Label>Объект, который должен отметить эксперт</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Автомобили"
                            value={objectToFind}
                            onChange={onObjectToFindChange}
                        />
                    </Form.Group>
                }
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button
                onClick={onSubmit}
                disabled={
                    (markupType === MarkupTypeEnum.CLASSIFICATION && options.length < 2) ||
                    (markupType === MarkupTypeEnum.RECOGNITION && objectToFind === "") ||
                    (markupType === MarkupTypeEnum.MULTI_RECOGNITION && objectToFind === "")
                }
            >Создать</Button>
            <Button variant="secondary" onClick={props.onHide}>Отмена</Button>
        </Modal.Footer>
    </Modal>;
}
