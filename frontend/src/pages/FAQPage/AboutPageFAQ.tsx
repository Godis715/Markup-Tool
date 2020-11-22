import React from "react";
import { Link } from "react-router-dom";

export default function AboutPageFAQ() {
    return <div>
        <h2>О проекте</h2>
        <p className="mt-3">
            Приложение <span className="highlighted">Markup-Tool</span> позволяет создавать качественные датасеты размеченных изображений
            с привлечением экспертов. Для того, чтобы разметить датасет, требуется лишь загрузить его в приложение,
            создать новое задание для разметки и назначить экспертов. После можно будет выгрузить результат в одном
            из форматов: .json, .csv, .xslx.
        </p>
        <p>
            Если же вы эксперт, выбранный для разметки изображений, вам нужно лишь перейти к списку заданий и
            приступить к их выполнению.
        </p>
        <div>
            <div className="github-link">
                <a href="https://github.com/Godis715/Markup-Tool">GitHub репозиторий</a>
            </div>
        </div>
    </div>
}
