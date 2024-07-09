import React, { FunctionComponent, useState } from 'react'
import { AmountInput, Button, Checkbox } from '../../atoms'
import { TransactionModal } from '../../molecules/transaction-modal'
import { Utils } from '../../../shared/utils'
import styles from './style.module.css'
import { Spacer } from '../../atoms/spacer'
import { abundance, crowdfund, server } from '../../../shared/contracts'
import { signTransaction } from '@stellar/freighter-api'
import {
  xdr, FeeBumpTransaction, Transaction,
  Keypair,
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk'
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  ISupportedWallet,
  XBULL_ID,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit/build/index";
import { useAppContext } from '../../../context/appContext'

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});

export interface IFormPledgeProps {
  account: string
  decimals: number
  symbol?: string
  onPledge: () => void
  updatedAt: number
}

export interface IResultSubmit {
  status: string
  value?: string
  symbol?: string
  error?: string
}

/**
 * Mint 100.0000000 tokens to the user's wallet for testing
 */
function MintButton({
  account,
  symbol,
  onComplete,
  decimals,
}: {
  decimals: number
  account: string
  symbol: string
  onComplete: () => void
}) {
  const [isSubmitting, setSubmitting] = useState(false)

  const displayAmount = 100
  const amount = BigInt(displayAmount * 10 ** decimals)
  const { activePubKey, setActivePubKey } = useAppContext();
  const StellarSdk = require("stellar-sdk");
  const RPC_SERVER = "https://soroban-testnet.stellar.org/";

  const signTx = async (tx) => {
    console.log('tx', tx)
    const signedXDR = await kit.signTx({
      xdr: tx.toXDR(),
      publicKeys: [activePubKey],
      network: WalletNetwork.TESTNET,
    });

    return signedXDR.result;
  }

  return (
    <Button
      title={`Mint ${displayAmount} ${symbol}`}
      onClick={async () => {
        setSubmitting(true)

        const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org:443",);
        const contractAddress = "CARKSRXI44GV5HP2IALCXRNJ6H6YZRXPI72UNNIIY7KEOYNP5ROH63NT";
        const contract = new Contract(contractAddress);
        const sourceAccount = await server.getAccount(activePubKey);
        let builtTransaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            contract.call(
              "mint",
              nativeToScVal(Address.fromString(activePubKey)),
              nativeToScVal(amount, { type: "i128" }),
            ),
          )
          .setTimeout(180)
          .build();

        console.log(`builtTransaction=${builtTransaction.toXDR()}`);
        let preparedTransaction = await server.prepareTransaction(builtTransaction);
        console.log('preparedTransaction',preparedTransaction.toXDR())
        const signedXDR = await kit.signTx({
          xdr: preparedTransaction.toXDR(),
          publicKeys: [activePubKey],
          network: WalletNetwork.TESTNET,
        });

        console.log('signedXDR',signedXDR.result)
        const signedTx = TransactionBuilder.fromXDR(signedXDR.result, StellarSdk.Networks.TESTNET);
        let sendResponse = await server.sendTransaction(signedTx);
        console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

        setSubmitting(false)
        onComplete()
      }}
      disabled={isSubmitting}
      isLoading={isSubmitting}
    />
  )
}

const FormPledge: FunctionComponent<IFormPledgeProps> = props => {
  const [balance, setBalance] = React.useState<BigInt>(BigInt(0))
  const [decimals, setDecimals] = React.useState<number>(0)
  const [symbol, setSymbol] = React.useState<string>()

  const [amount, setAmount] = useState<number>()
  const [resultSubmit, setResultSubmit] = useState<IResultSubmit | undefined>()
  const [input, setInput] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)
  const { activePubKey, setActivePubKey } = useAppContext();
  const StellarSdk = require("stellar-sdk");
  //const server2 = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

  const RPC_SERVER = "https://soroban-testnet.stellar.org/";
  const server2 = new SorobanRpc.Server(RPC_SERVER);

  React.useEffect(() => {
    Promise.all([
      abundance.balance({ id: props.account }),
      abundance.decimals(),
      abundance.symbol(),
    ]).then(fetched => {
      setBalance(fetched[0].result)
      setDecimals(fetched[1].result)
      setSymbol(fetched[2].result.toString())
    })
  }, [props.account, props.updatedAt])

  const clearInput = (): void => {
    setInput('')
  }

  const handleSubmit = async (): Promise<void> => {
    if (!amount) return

    setSubmitting(true)

    try {
      ////

      const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org:443",);
      const contractAddress = "CCKMR2MCVNOZHQKEKQX4RZKYA2A26Q6INXUW74XP3DN3DFU7IB7QFW7S";
      const contract = new Contract(contractAddress);
      const sourceAccount = await server.getAccount(activePubKey);
      let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            "deposit",
            nativeToScVal(Address.fromString(activePubKey)),
            nativeToScVal(BigInt(amount * 10 ** decimals), { type: "i128" }),
          ),
        )
        .setTimeout(180)
        .build();

      console.log(`builtTransaction=${builtTransaction.toXDR()}`);
      let preparedTransaction = await server.prepareTransaction(builtTransaction);
      console.log('preparedTransaction',preparedTransaction.toXDR())
      const signedXDR = await kit.signTx({
        xdr: preparedTransaction.toXDR(),
        publicKeys: [activePubKey],
        network: WalletNetwork.TESTNET,
      });

      console.log('signedXDR',signedXDR.result)
      const signedTx = TransactionBuilder.fromXDR(signedXDR.result, StellarSdk.Networks.TESTNET);
      let sendResponse = await server.sendTransaction(signedTx);
      console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      /////
      /*
      const tx = await crowdfund.deposit({
        user: props.account,
        amount: BigInt(amount * 10 ** decimals),
      })
      */
      setResultSubmit({
        status: 'success',
        value: String(amount),
        symbol,
      })
      props.onPledge()
      setInput('')
      setAmount(undefined)
    } catch (e) {
      if (e instanceof Error) {
        setResultSubmit({
          status: 'error',
          error: e?.message || 'An error has occurred',
        })
      } else {
        throw e
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h6>Choose Amount</h6>
      <div className={styles.wrapper}>
        <Checkbox
          title={`100 ${props.symbol}`}
          value={100}
          isChecked={amount == 100}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`250 ${props.symbol}`}
          value={250}
          isChecked={amount == 250}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`500 ${props.symbol}`}
          value={500}
          isChecked={amount == 500}
          setAmount={setAmount}
          clearInput={clearInput}
        />
        <Checkbox
          title={`1000 ${props.symbol}`}
          value={1000}
          isChecked={amount == 1000}
          setAmount={setAmount}
          clearInput={clearInput}
        />
      </div>
      <div className={styles.centerContent}>
        <h6>OR</h6>
      </div>
      <AmountInput
        placeHolder="Custom amount"
        setAmount={setAmount}
        input={input}
        setInput={setInput}
      />
      <Button
        title={'Back this project'}
        onClick={handleSubmit}
        disabled={!amount || isSubmitting}
        isLoading={isSubmitting}
      />
      {props.account && props.decimals && props.symbol ? (
        <div>
          <Spacer rem={1} />
          <MintButton
            account={props.account}
            symbol={props.symbol}
            decimals={decimals}
            onComplete={() => props.onPledge()}
          />
          <div className={styles.wrapper}>
            <div>
              <h6>
                Your balance: {Utils.formatAmount(balance, decimals)} {symbol}
              </h6>
            </div>
          </div>
        </div>
      ) : null}
      {resultSubmit && (
        <TransactionModal
          result={resultSubmit}
          closeModal={() => setResultSubmit(undefined)}
        />
      )}
    </div>
  )
}

export { FormPledge }
