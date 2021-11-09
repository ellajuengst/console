/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import CredentialsPage from './Credentials'

export default function CredentialsPlugin() {
    return (
        <RecoilRoot>
            <CredentialsPage />
        </RecoilRoot>
    )
}
