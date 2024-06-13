export function leaderRandomize(leadersToExclude, leaderModules) {
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
        "tessia-vernius",
        "viscount-hundro-moritani"
    ];

    if (leaderModules) {
        leaders = leaders.concat(riseOfIXLeaders);
    }

    var indexToExclude = [];

    for (let index = 0; index < leadersToExclude; index++) {
        var indexTemp = Math.floor(Math.random() * leaders.length);
        while (indexToExclude.includes(indexTemp)) {
            indexTemp = Math.floor(Math.random() * leaders.length);
        }
        indexToExclude.push(indexTemp);
    }

    var gameLeaders = leaders.filter((leader, index) => !indexToExclude.includes(index));
    var excludedLeaders = leaders.filter((leader, index) => indexToExclude.includes(index));

    return {
        gameLeaders,
        excludedLeaders
    }
}