export function leaderRandomize(leaderToExclude) {
    const leaders = [
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