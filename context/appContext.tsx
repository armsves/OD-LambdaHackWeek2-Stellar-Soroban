"use client"
import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext<any>(undefined);

export function AppWrapper({ children } : { children: React.ReactNode }) {

    let [activePubKey, setActivePubKey] = useState<string | null>(null);
    let [balance2, setBalance2] = useState<number | null>(null);

    return (
        <AppContext.Provider value={{activePubKey, setActivePubKey, balance2, setBalance2}}>
            {children}
        </AppContext.Provider>
    )
}   

export function useAppContext() {
    return useContext(AppContext);
}