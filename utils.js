function calculateAge (birthday, current) {
    var birthday = new Date(birthday);
    var age = current.getFullYear() - birthday.getFullYear();
    var m = current.getMonth() - birthday.getMonth();

    if (m < 0 || (m === 0 && current.getDate() < birthday.getDate())) {
        age--;
    }

    return age;
}

function formatDate(date) {
    var month = '' + (date.getMonth() + 1);
    var day = '' + date.getDate();
    var year = date.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

module.exports = { 
    calculateAge: calculateAge,
    formatDate: formatDate,
    shuffle: shuffle
};