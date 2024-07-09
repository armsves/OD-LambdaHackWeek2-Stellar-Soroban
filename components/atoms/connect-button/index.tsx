
import React, { useEffect, useState, useRef } from 'react'
import {
    StellarWalletsKit,
    WalletNetwork,
    allowAllModules,
    ISupportedWallet,
    XBULL_ID,
} from "@creit.tech/stellar-wallets-kit/build/index";
import styles from './style.module.css'
import { useAppContext } from '../../../context/appContext'
import { Horizon } from '@stellar/stellar-sdk'

export interface ConnectButtonProps {
    label: string
    isHigher?: boolean
}

const kit: StellarWalletsKit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: XBULL_ID,
    modules: allowAllModules(),
});

export const ConnectButton: React.FC = () => {
    const { activePubKey, setActivePubKey } = useAppContext();
    const { balance2, setBalance2 } = useAppContext();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const onClick = async () => {
        //setConnectionError(null);
        // See https://github.com/Creit-Tech/Stellar-Wallets-Kit/tree/main for more options
        if (!activePubKey) {
            await kit.openModal({
                modalDialogStyles: {
                    ["backgroundColor"]: "#ffffff",
                    ["color"]: '#fff',
                },
                onWalletSelected: async (option: ISupportedWallet) => {
                    kit.setWallet(option.id);
                    //console.log('option', option)
                    //console.log('option', option.id)
                    const publicKey = await kit.getPublicKey();
                    console.log('publicKeys', publicKey);
                    setActivePubKey(publicKey);
                    //createUserLogIn(publicKey);
                }
            });
        }
    };

    const getBalance = async () => {
        if (activePubKey) {
            try {
                const server = new Horizon.Server('https://horizon-testnet.stellar.org');
                //const account = await server.loadAccount(activePubKey);
                const account = await server.accounts().accountId(activePubKey).call();
                //const claimableBalances = await server.claimableBalances().claimant(activePubKey).call();
                //console.log('claimableBalances', claimableBalances);
                //console.log(account.balances[0].balance);
                console.log('account.balances', await account.balances)
                //const balance = await account.balances[0].balance;
                const balance = await account.balances;
                setBalance2(balance);
                //console.log('balance XLM', balance);
                //console.log('activePubKey', activePubKey);
            } catch (error) {
                console.error('An error occurred:', error);
            }
        }
    }

    useEffect(() => {
        //console.log('useEffect iniciado')
        getBalance();
    }, [activePubKey]);

    return (
        <>
            {activePubKey ? (
                <div className="relative" ref={dropdownRef}>
                    <button
                        className={styles.button}
                        onClick={() => setDropdownOpen(!dropdownOpen)} >
                        <div className="font-rooftop flex items-center">
                            {`${activePubKey?.slice(0, 4)}...${activePubKey?.slice(-4)}`.toUpperCase()}
                        </div>
                    </button>
                    {dropdownOpen && (
                        <button
                            className={styles.button}
                            onClick={() => {
                                setActivePubKey(null);
                                setBalance2(null);
                                setDropdownOpen(false);
                            }}
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            ) : (
                <button

                    className={styles.button}
                    onClick={onClick}
                >
                    {activePubKey ? "Next" : "Connect Wallet"}
                </button>
            )}
        </>
    )
}
