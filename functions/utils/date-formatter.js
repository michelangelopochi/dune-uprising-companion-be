export function timerFormatter(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 24;

    var stringSeconds = seconds < 10 ? `0${seconds}` : seconds;
    var stringMinutes = minutes < 10 ? `0${minutes}` : minutes;
    var stringHours = hours < 10 ? `0${hours}` : hours;

    return `${stringHours}:${stringMinutes}:${stringSeconds}`;
}

export function timeStringToMilliseconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);

    const hoursInMilliseconds = hours * 60 * 60 * 1000;
    const minutesInMilliseconds = minutes * 60 * 1000;
    const secondsInMilliseconds = seconds * 1000;

    const totalMilliseconds = hoursInMilliseconds + minutesInMilliseconds + secondsInMilliseconds;

    return totalMilliseconds;
}