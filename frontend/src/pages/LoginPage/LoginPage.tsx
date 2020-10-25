import React, { useState } from "react";

type Props = {
    onLogin: (login: string, password: string) => any,
    errorMessage?: string | null
};

type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export default function LoginPage(props: Props): JSX.Element {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const onLoginChange = (ev: InputChangeEvent) => setLogin(ev.target.value);
    const onPasswordChange = (ev: InputChangeEvent) => setPassword(ev.target.value);
    const onLogin = () => {
        props.onLogin(login, password);
    };

    return <div>
        <input type="text" value={login} onChange={onLoginChange} />
        <input type="password" value={password} onChange={onPasswordChange} />
        <button onClick={onLogin}>Войти</button>
        {
            props.errorMessage &&
            <div>{props.errorMessage}</div>
        }
    </div>;
}
