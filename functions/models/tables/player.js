/* Game player template*/

const Player = {
    isGuest: false,
    username: "",
    order: 0,
    leader: "",
    color: "",
    colorCode: "",
    isActive: false,
    activeDate: "",
    time: "00:00:00",
    tempTime: "00:00:00", //valore temporaneo per gestire aggiornamento cronometro
    totalPoints: 1,
    tsmfAcquired: 0,
    conflictPoints: 0,
    otherPoints: 0,
    fremenFriendship: false,
    beneGesseritFriendship: false,
    spacingGuildFriendship: false,
    emperorFriendship: false,
    fremenAlliance: false,
    beneGesseritAlliance: false,
    spacingGuildAlliance: false,
    emperorAlliance: false,
    solari: 0,
    spice: 0,
    water: 1,
    troops: 0,
    startingDeck: [
        {
            key: "",
            name: "",
            img: "",
            copy: 0
        }
    ],
    cards: [
        {
            key: "",
            name: "",
            img: "",
            copy: 0
        }
    ],
    trashedCards: [
        {
            key: "",
            name: "",
            img: "",
            copy: 0
        }
    ]

}