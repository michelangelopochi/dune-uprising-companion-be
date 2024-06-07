export function leaderRandomize(leadersToExclude, moduleLeaders) {
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

    if (moduleLeaders.length > 0) {
        leaders = leaders.concat(moduleLeaders);
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