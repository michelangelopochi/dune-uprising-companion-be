export function leaderRandomize(leaderToExclude, includesRiseOfIx) {
    var leaders = [
        "feyd-rautha-harkonnen",
        "gurney-halleck",
        "lady-amber-metulli",
        "lady-jessica",
        "lady-margot-fenring",
        "muad-dib",
        "princess-irulan",
        "shaddam-corrino-iv",
        "staban-tuek",
    ];

    var riseOfIXLeaders = [
        "archduke-armand-ecaz",
        "ilesa-ecaz",
        "prince-rhombur-vernus",
        "princess-yuna-moritani",
        "tessia-vernus",
        "viscount-hundro-moritani"
    ];

    if (includesRiseOfIx) {
        leaders = leaders.concat(riseOfIXLeaders);
    }

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