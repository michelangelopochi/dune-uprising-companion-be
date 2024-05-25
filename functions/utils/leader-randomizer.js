export function leaderRandomize(leaderToExclude) {
    const leaders = [
        "FEYD-RAUTHA HARKONNEN",
        "GURNEY HALLECK",
        "LADY AMBER METULLI",
        "LADY JESSICA",
        "LADY MARGOT FENRING",
        "MUAD'DIB",
        "PRINCESS IRULAN",
        "SHADDAM CORRINO IV",
        "STABAN TUEK"
    ]

    var indexToExclude = [];

    for (let index = 0; index < leaderToExclude; index++) {
        indexToExclude.push(Math.floor(Math.random() * leaders.length));
    }

    var gameLeaders = leaders.filter((leader, index) => !indexToExclude.includes(index));
    var excludedLeaders = leaders.filter((leader, index) => indexToExclude.includes(index));

    return {
        gameLeaders,
        excludedLeaders
    }
}