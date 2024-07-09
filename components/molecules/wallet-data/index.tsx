import React from 'react'
import { useAccount, useIsMounted} from '../../../hooks'
import { ConnectButton } from '../../atoms'
import styles from './style.module.css'

// TODO: Eliminate flash of unconnected content on loading
export function WalletData() {
  const mounted = useIsMounted()
  const account = useAccount()

  return (
    <>
        <ConnectButton />
    </>
  )
}
