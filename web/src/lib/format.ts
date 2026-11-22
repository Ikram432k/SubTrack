export function formatPrice(paise: number, currency = "INR"){
    return Intl.NumberFormat("en-IN",{
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(paise/ 100);
}