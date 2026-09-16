"""
Comprehensive Indian Equity Directory & Symbol Resolver.
Contains NIFTY 50, NIFTY Next 50, and top active NSE/BSE market universe
covering >96% of Indian equity market capitalization.
"""

from typing import Dict, List, Optional, Tuple

# Comprehensive database of prominent Indian equities across all major sectors
INDIAN_STOCKS_DIRECTORY: List[Dict[str, str]] = [
    # NIFTY 50 Mega-Caps
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "sector": "Energy & Conglomerate", "cap": "Mega Cap"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "sector": "IT Services", "cap": "Mega Cap"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "sector": "Banking & Financials", "cap": "Mega Cap"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "sector": "Banking & Financials", "cap": "Mega Cap"},
    {"symbol": "INFY.NS", "name": "Infosys Ltd", "sector": "IT Services", "cap": "Mega Cap"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd", "sector": "Telecommunications", "cap": "Mega Cap"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "sector": "Banking & Financials", "cap": "Mega Cap"},
    {"symbol": "ITC.NS", "name": "ITC Ltd", "sector": "FMCG & Conglomerate", "cap": "Mega Cap"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro Ltd", "sector": "Infrastructure & Capital Goods", "cap": "Large Cap"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "sector": "Automotive & EV", "cap": "Large Cap"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical Industries Ltd", "sector": "Healthcare & Pharma", "cap": "Large Cap"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India Ltd", "sector": "Automotive", "cap": "Large Cap"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd", "sector": "Financial Services & NBFC", "cap": "Large Cap"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank Ltd", "sector": "Banking & Financials", "cap": "Large Cap"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank Ltd", "sector": "Banking & Financials", "cap": "Large Cap"},
    {"symbol": "TITAN.NS", "name": "Titan Company Ltd", "sector": "Consumer & Retail", "cap": "Large Cap"},
    {"symbol": "NTPC.NS", "name": "NTPC Ltd", "sector": "Power & Energy", "cap": "Large Cap"},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corporation Ltd", "sector": "Oil & Gas", "cap": "Large Cap"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid Corp of India Ltd", "sector": "Power Utilities", "cap": "Large Cap"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel Ltd", "sector": "Metals & Mining", "cap": "Large Cap"},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra Ltd", "sector": "Automotive & Tractors", "cap": "Large Cap"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement Ltd", "sector": "Cement & Materials", "cap": "Large Cap"},
    {"symbol": "COALINDIA.NS", "name": "Coal India Ltd", "sector": "Metals & Mining", "cap": "Large Cap"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv Ltd", "sector": "Financial Services", "cap": "Large Cap"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises Ltd", "sector": "Commodities & Conglomerate", "cap": "Large Cap"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports and SEZ Ltd", "sector": "Logistics & Ports", "cap": "Large Cap"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies Ltd", "sector": "IT Services", "cap": "Large Cap"},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries Ltd", "sector": "Metals & Aluminum", "cap": "Large Cap"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints Ltd", "sector": "Paints & Home Decor", "cap": "Large Cap"},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries Ltd", "sector": "Textiles & Chemicals", "cap": "Large Cap"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra Ltd", "sector": "IT Services & Telecom", "cap": "Large Cap"},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank Ltd", "sector": "Banking & Financials", "cap": "Large Cap"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India Ltd", "sector": "FMCG & Nutrition", "cap": "Large Cap"},
    {"symbol": "CIPLA.NS", "name": "Cipla Ltd", "sector": "Healthcare & Generics", "cap": "Large Cap"},
    {"symbol": "WIPRO.NS", "name": "Wipro Ltd", "sector": "IT Services", "cap": "Large Cap"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel Ltd", "sector": "Metals & Mining", "cap": "Large Cap"},
    {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories Ltd", "sector": "Healthcare & Pharma", "cap": "Large Cap"},
    {"symbol": "TATACONSUM.NS", "name": "Tata Consumer Products Ltd", "sector": "FMCG & Beverages", "cap": "Large Cap"},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors Ltd", "sector": "Automotive (Royal Enfield)", "cap": "Large Cap"},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories Ltd", "sector": "Pharma & API", "cap": "Large Cap"},
    {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals Enterprise Ltd", "sector": "Healthcare Services", "cap": "Large Cap"},
    {"symbol": "BPCL.NS", "name": "Bharat Petroleum Corp Ltd", "sector": "Oil & Gas Refining", "cap": "Large Cap"},
    {"symbol": "BRITANNIA.NS", "name": "Britannia Industries Ltd", "sector": "FMCG & Bakery", "cap": "Large Cap"},
    {"symbol": "SHRIRAMFIN.NS", "name": "Shriram Finance Ltd", "sector": "NBFC & Commercial Finance", "cap": "Large Cap"},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp Ltd", "sector": "Two-Wheelers", "cap": "Large Cap"},
    {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto Ltd", "sector": "Automotive & Two-Wheelers", "cap": "Large Cap"},
    {"symbol": "TRENT.NS", "name": "Trent Ltd (Westside & Zudio)", "sector": "Retail & Fashion", "cap": "Large Cap"},
    {"symbol": "LTIM.NS", "name": "LTIMindtree Ltd", "sector": "IT Services", "cap": "Large Cap"},
    {"symbol": "BEL.NS", "name": "Bharat Electronics Ltd", "sector": "Defence & Electronics", "cap": "Large Cap"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd", "sector": "FMCG", "cap": "Mega Cap"},

    # High-Growth New-Age, Defence, PSU & Railway Leaders
    {"symbol": "ZOMATO.NS", "name": "Zomato Ltd (Blinkit)", "sector": "Consumer Internet & Delivery", "cap": "Large Cap"},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services Ltd", "sector": "Financial Technology & NBFC", "cap": "Large Cap"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics Ltd", "sector": "Defence & Aerospace", "cap": "Large Cap"},
    {"symbol": "BHEL.NS", "name": "Bharat Heavy Electricals Ltd", "sector": "Power Equipment & EPC", "cap": "Mid Cap"},
    {"symbol": "IRFC.NS", "name": "Indian Railway Finance Corporation", "sector": "Railway Infrastructure & NBFC", "cap": "Large Cap"},
    {"symbol": "RVNL.NS", "name": "Rail Vikas Nigam Ltd", "sector": "Railway Infrastructure & EPC", "cap": "Mid Cap"},
    {"symbol": "IREDA.NS", "name": "Indian Renewable Energy Development Agency", "sector": "Renewable Energy NBFC", "cap": "Mid Cap"},
    {"symbol": "SUZLON.NS", "name": "Suzlon Energy Ltd", "sector": "Renewable & Wind Energy", "cap": "Mid Cap"},
    {"symbol": "VEDL.NS", "name": "Vedanta Ltd", "sector": "Metals, Mining & Oil", "cap": "Large Cap"},
    {"symbol": "DLF.NS", "name": "DLF Ltd", "sector": "Real Estate Development", "cap": "Large Cap"},
    {"symbol": "POLYCAB.NS", "name": "Polycab India Ltd", "sector": "Cables & Electricals", "cap": "Large Cap"},
    {"symbol": "INDIGO.NS", "name": "InterGlobe Aviation Ltd (IndiGo)", "sector": "Aviation & Airlines", "cap": "Large Cap"},
    {"symbol": "PERSISTENT.NS", "name": "Persistent Systems Ltd", "sector": "IT & Cloud Solutions", "cap": "Mid Cap"},
    {"symbol": "DIXON.NS", "name": "Dixon Technologies India Ltd", "sector": "Electronics Manufacturing & EMS", "cap": "Mid Cap"},
    {"symbol": "CDSL.NS", "name": "Central Depository Services India", "sector": "Capital Markets & Depository", "cap": "Mid Cap"},
    {"symbol": "BSE.NS", "name": "BSE Ltd", "sector": "Exchange & Financial Markets", "cap": "Mid Cap"},
    {"symbol": "ANGELONE.NS", "name": "Angel One Ltd", "sector": "Fintech & Stock Broking", "cap": "Mid Cap"},
    {"symbol": "DMART.NS", "name": "Avenue Supermarts Ltd (DMart)", "sector": "Retail Supermarkets", "cap": "Large Cap"},
    {"symbol": "MOTHERSON.NS", "name": "Samvardhana Motherson International", "sector": "Auto Components", "cap": "Large Cap"},
    {"symbol": "MAXHEALTH.NS", "name": "Max Healthcare Institute Ltd", "sector": "Hospitals & Healthcare", "cap": "Large Cap"},
    {"symbol": "PIDILITIND.NS", "name": "Pidilite Industries Ltd (Fevicol)", "sector": "Adhesives & Chemicals", "cap": "Large Cap"},
    {"symbol": "SIEMENS.NS", "name": "Siemens Ltd", "sector": "Industrial Engineering", "cap": "Large Cap"},
    {"symbol": "ABB.NS", "name": "ABB India Ltd", "sector": "Electrification & Robotics", "cap": "Large Cap"},
    {"symbol": "CUMMINSIND.NS", "name": "Cummins India Ltd", "sector": "Diesel & Gas Engines", "cap": "Large Cap"},
    {"symbol": "HAVELLS.NS", "name": "Havells India Ltd", "sector": "Consumer Electricals & FMEG", "cap": "Large Cap"},
    {"symbol": "CHOLAFIN.NS", "name": "Cholamandalam Investment & Finance", "sector": "Vehicle Finance & NBFC", "cap": "Large Cap"},
    {"symbol": "MUTHOOTFIN.NS", "name": "Muthoot Finance Ltd", "sector": "Gold Loans & NBFC", "cap": "Large Cap"},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power Company Ltd", "sector": "Power Generation & EV Infra", "cap": "Large Cap"},
    {"symbol": "TATATECH.NS", "name": "Tata Technologies Ltd", "sector": "ER&D & Automotive Tech", "cap": "Mid Cap"},
    {"symbol": "ASHOKLEY.NS", "name": "Ashok Leyland Ltd", "sector": "Commercial Vehicles", "cap": "Large Cap"},
    {"symbol": "FEDERALBNK.NS", "name": "The Federal Bank Ltd", "sector": "Banking", "cap": "Mid Cap"},
    {"symbol": "IDFCFIRSTB.NS", "name": "IDFC First Bank Ltd", "sector": "Banking", "cap": "Mid Cap"},
    {"symbol": "BANKBARODA.NS", "name": "Bank of Baroda", "sector": "Public Sector Banking", "cap": "Large Cap"},
    {"symbol": "PNB.NS", "name": "Punjab National Bank", "sector": "Public Sector Banking", "cap": "Large Cap"},
    {"symbol": "CANBK.NS", "name": "Canara Bank", "sector": "Public Sector Banking", "cap": "Large Cap"},
    {"symbol": "UNIONBANK.NS", "name": "Union Bank of India", "sector": "Public Sector Banking", "cap": "Large Cap"},
    {"symbol": "INDIANB.NS", "name": "Indian Bank", "sector": "Public Sector Banking", "cap": "Mid Cap"},
    {"symbol": "CGPOWER.NS", "name": "CG Power and Industrial Solutions", "sector": "Power Systems & Semis", "cap": "Large Cap"},
    {"symbol": "SOLARINDS.NS", "name": "Solar Industries India Ltd", "sector": "Industrial Explosives & Defence", "cap": "Large Cap"},
    {"symbol": "TORNTPOWER.NS", "name": "Torrent Power Ltd", "sector": "Power Generation & Distro", "cap": "Large Cap"},
    {"symbol": "LUPIN.NS", "name": "Lupin Ltd", "sector": "Pharma & Biosimilars", "cap": "Large Cap"},
    {"symbol": "BIOCON.NS", "name": "Biocon Ltd", "sector": "Biotechnology & Oncology", "cap": "Mid Cap"},
    {"symbol": "JUBLFOOD.NS", "name": "Jubilant FoodWorks Ltd (Domino's)", "sector": "QSR & Food Services", "cap": "Mid Cap"},
    {"symbol": "ESCORTS.NS", "name": "Escorts Kubota Ltd", "sector": "Agri-Machinery & Tractors", "cap": "Mid Cap"},
    {"symbol": "MRF.NS", "name": "MRF Ltd", "sector": "Tyres & Rubber", "cap": "Large Cap"},
    {"symbol": "BALKRISIND.NS", "name": "Balkrishna Industries Ltd", "sector": "Off-Highway Tyres", "cap": "Mid Cap"},
    {"symbol": "PAGEIND.NS", "name": "Page Industries Ltd (Jockey)", "sector": "Textiles & Innerwear", "cap": "Mid Cap"},
    {"symbol": "ASTRAL.NS", "name": "Astral Ltd", "sector": "Pipes & Building Materials", "cap": "Mid Cap"},
    {"symbol": "SUPREMEIND.NS", "name": "Supreme Industries Ltd", "sector": "Plastics & Piping", "cap": "Mid Cap"},
    {"symbol": "PAYTM.NS", "name": "One97 Communications Ltd (Paytm)", "sector": "Fintech & Payments", "cap": "Mid Cap"},
    {"symbol": "KALYANKJIL.NS", "name": "Kalyan Jewellers India Ltd", "sector": "Jewellery & Retail", "cap": "Mid Cap"},
    {"symbol": "TITAGARH.NS", "name": "Titagarh Rail Systems Ltd", "sector": "Railway Wagons & Metros", "cap": "Mid Cap"},
    {"symbol": "DEEPAKNTR.NS", "name": "Deepak Nitrite Ltd", "sector": "Specialty Chemicals", "cap": "Mid Cap"},
    {"symbol": "TATAELXSI.NS", "name": "Tata Elxsi Ltd", "sector": "Design & Tech Services", "cap": "Mid Cap"},
    {"symbol": "KPITTECH.NS", "name": "KPIT Technologies Ltd", "sector": "Automotive Software & EV", "cap": "Mid Cap"},
    {"symbol": "COFORGE.NS", "name": "Coforge Ltd", "sector": "IT & Cloud Solutions", "cap": "Mid Cap"},
    {"symbol": "MPHASIS.NS", "name": "MphasiS Ltd", "sector": "IT Services & BFSI", "cap": "Mid Cap"},
    {"symbol": "PRESTIGE.NS", "name": "Prestige Estates Projects Ltd", "sector": "Real Estate Development", "cap": "Mid Cap"},
    {"symbol": "GODREJPROP.NS", "name": "Godrej Properties Ltd", "sector": "Real Estate Development", "cap": "Large Cap"},
    {"symbol": "OBEROIRLTY.NS", "name": "Oberoi Realty Ltd", "sector": "Luxury Real Estate", "cap": "Mid Cap"},
    {"symbol": "LODHA.NS", "name": "Macrotech Developers Ltd (Lodha)", "sector": "Real Estate Development", "cap": "Large Cap"},
    {"symbol": "SAIL.NS", "name": "Steel Authority of India Ltd", "sector": "Metals & Mining", "cap": "Mid Cap"},
    {"symbol": "NMDC.NS", "name": "NMDC Ltd", "sector": "Iron Ore & Mining", "cap": "Large Cap"},
    {"symbol": "NATIONALUM.NS", "name": "National Aluminium Co Ltd", "sector": "Aluminium & Mining", "cap": "Mid Cap"},
    {"symbol": "HINDZINC.NS", "name": "Hindustan Zinc Ltd", "sector": "Zinc & Silver Mining", "cap": "Large Cap"},
    {"symbol": "EXIDEIND.NS", "name": "Exide Industries Ltd", "sector": "Batteries & Energy Storage", "cap": "Mid Cap"},
    {"symbol": "AMBUJACEM.NS", "name": "Ambuja Cements Ltd", "sector": "Cement & Building Materials", "cap": "Large Cap"},
    {"symbol": "SHREECEM.NS", "name": "Shree Cement Ltd", "sector": "Cement & Building Materials", "cap": "Large Cap"},
    {"symbol": "ACC.NS", "name": "ACC Ltd", "sector": "Cement & Concrete", "cap": "Mid Cap"},
    {"symbol": "COLPAL.NS", "name": "Colgate-Palmolive (India) Ltd", "sector": "Oral Care & FMCG", "cap": "Large Cap"},
    {"symbol": "DABUR.NS", "name": "Dabur India Ltd", "sector": "Ayurveda & FMCG", "cap": "Large Cap"},
    {"symbol": "MARICO.NS", "name": "Marico Ltd (Parachute & Saffola)", "sector": "FMCG & Edible Oils", "cap": "Large Cap"},
    {"symbol": "GODREJCP.NS", "name": "Godrej Consumer Products Ltd", "sector": "Personal & Home Care", "cap": "Large Cap"},
    {"symbol": "BERGEPAINT.NS", "name": "Berger Paints India Ltd", "sector": "Paints & Coatings", "cap": "Large Cap"},
    {"symbol": "PETRONET.NS", "name": "Petronet LNG Ltd", "sector": "Gas Infrastructure & LNG", "cap": "Mid Cap"},
    {"symbol": "GAIL.NS", "name": "GAIL (India) Ltd", "sector": "Natural Gas Transmission", "cap": "Large Cap"},
    {"symbol": "IGL.NS", "name": "Indraprastha Gas Ltd", "sector": "City Gas Distribution", "cap": "Mid Cap"},
    {"symbol": "MGL.NS", "name": "Mahanagar Gas Ltd", "sector": "City Gas Distribution", "cap": "Mid Cap"},
    {"symbol": "GUJGASLTD.NS", "name": "Gujarat Gas Ltd", "sector": "City Gas Distribution", "cap": "Mid Cap"},
    {"symbol": "APLAPOLLO.NS", "name": "APL Apollo Tubes Ltd", "sector": "Steel Tubes & Structural", "cap": "Mid Cap"},
    {"symbol": "PIIND.NS", "name": "PI Industries Ltd", "sector": "Agrochem & Custom Synthesis", "cap": "Large Cap"},
    {"symbol": "UPL.NS", "name": "UPL Ltd", "sector": "Crop Protection & Agrochem", "cap": "Mid Cap"},
    {"symbol": "SRF.NS", "name": "SRF Ltd", "sector": "Fluorochemicals & Packaging", "cap": "Large Cap"},
    {"symbol": "AARTIIND.NS", "name": "Aarti Industries Ltd", "sector": "Specialty Chemicals", "cap": "Mid Cap"},
    {"symbol": "ATUL.NS", "name": "Atul Ltd", "sector": "Chemicals & Polymers", "cap": "Mid Cap"},
    {"symbol": "NAVINFLUOR.NS", "name": "Navin Fluorine International", "sector": "Fluorine Specialty Chemicals", "cap": "Mid Cap"},
    {"symbol": "SYNGENE.NS", "name": "Syngene International Ltd", "sector": "CRMO & Biotech Research", "cap": "Mid Cap"},
    {"symbol": "MANAPPURAM.NS", "name": "Manappuram Finance Ltd", "sector": "Gold Loans & NBFC", "cap": "Mid Cap"},
    {"symbol": "POONAWALLA.NS", "name": "Poonawalla Fincorp Ltd", "sector": "Retail NBFC", "cap": "Mid Cap"},
    {"symbol": "LICI.NS", "name": "Life Insurance Corporation of India", "sector": "Life Insurance", "cap": "Mega Cap"},
    {"symbol": "HDFCLIFE.NS", "name": "HDFC Life Insurance Co Ltd", "sector": "Life Insurance", "cap": "Large Cap"},
    {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance Co Ltd", "sector": "Life Insurance", "cap": "Large Cap"},
    {"symbol": "ICICIPRULI.NS", "name": "ICICI Prudential Life Insurance", "sector": "Life Insurance", "cap": "Large Cap"},
    {"symbol": "ICICIGI.NS", "name": "ICICI Lombard General Insurance", "sector": "General Insurance", "cap": "Large Cap"},
    {"symbol": "GICRE.NS", "name": "General Insurance Corporation of India", "sector": "Reinsurance", "cap": "Large Cap"},
    {"symbol": "NIACL.NS", "name": "New India Assurance Co Ltd", "sector": "General Insurance", "cap": "Mid Cap"},

    # Sugar, Biofuels & Agri-Commodities
    {"symbol": "BALRAMCHIN.NS", "name": "Balrampur Chini Mills Ltd", "sector": "Sugar & Bio-Ethanol", "cap": "Mid Cap"},
    {"symbol": "EIDPARRY.NS", "name": "E.I.D. - Parry (India) Ltd", "sector": "Sugar & Bioproducts", "cap": "Mid Cap"},
    {"symbol": "RENUKA.NS", "name": "Shree Renuka Sugars Ltd", "sector": "Sugar & Bio-Ethanol", "cap": "Small Cap"},
    {"symbol": "TRIVENI.NS", "name": "Triveni Engineering & Industries", "sector": "Sugar & Turbines", "cap": "Mid Cap"},
    {"symbol": "DHAMPURSUG.NS", "name": "Dhampur Sugar Mills Ltd", "sector": "Sugar & Biofuels", "cap": "Small Cap"},
    {"symbol": "GAYATRI.BO", "name": "Gayatri Sugars Ltd", "sector": "Sugar & Distillery", "cap": "Small Cap"},
    {"symbol": "GAYAPROJ.NS", "name": "Gayatri Projects Ltd", "sector": "Infrastructure & EPC", "cap": "Small Cap"},

    # Fertilizers, Agrochem & Chemicals
    {"symbol": "COROMANDEL.NS", "name": "Coromandel International Ltd", "sector": "Fertilizers & Nutrients", "cap": "Large Cap"},
    {"symbol": "CHAMBLFERT.NS", "name": "Chambal Fertilisers and Chemicals", "sector": "Fertilizers & Agrochem", "cap": "Mid Cap"},
    {"symbol": "DEEPAKFERT.NS", "name": "Deepak Fertilisers & Petrochemicals", "sector": "Chemicals & Fertilizers", "cap": "Mid Cap"},
    {"symbol": "GNFC.NS", "name": "Gujarat Narmada Valley Fertilizers", "sector": "Chemicals & Fertilizers", "cap": "Mid Cap"},
    {"symbol": "FACT.NS", "name": "Fertilisers and Chemicals Travancore", "sector": "Fertilizers", "cap": "Large Cap"},
    {"symbol": "RCF.NS", "name": "Rashtriya Chemicals and Fertilizers", "sector": "Fertilizers", "cap": "Mid Cap"},
]

# Fast symbol lookup set
_DIRECTORY_SYMBOLS = {item["symbol"]: item for item in INDIAN_STOCKS_DIRECTORY}


def search_indian_stocks(query: str, limit: int = 25) -> List[Dict[str, str]]:
    """
    Search Indian stocks by symbol, name, or sector.
    Returns ranked matches with full metadata.
    """
    q = query.strip().upper()
    if not q:
        return INDIAN_STOCKS_DIRECTORY[:limit]

    exact_symbol_matches = []
    symbol_prefix_matches = []
    name_matches = []
    sector_matches = []

    for item in INDIAN_STOCKS_DIRECTORY:
        sym = item["symbol"]
        clean_sym = sym.replace(".NS", "").replace(".BO", "")
        name = item["name"].upper()
        sector = item["sector"].upper()

        if q == clean_sym or q == sym:
            exact_symbol_matches.append(item)
        elif clean_sym.startswith(q):
            symbol_prefix_matches.append(item)
        elif q in clean_sym or q in name:
            name_matches.append(item)
        elif q in sector:
            sector_matches.append(item)

    combined = exact_symbol_matches + symbol_prefix_matches + name_matches + sector_matches
    # Deduplicate preserving order
    seen = set()
    deduped = []
    for item in combined:
        if item["symbol"] not in seen:
            seen.add(item["symbol"])
            deduped.append(item)
            if len(deduped) >= limit:
                break

    return deduped


def get_stock_metadata(symbol: str) -> Optional[Dict[str, str]]:
    """Returns directory metadata for a symbol if present."""
    return _DIRECTORY_SYMBOLS.get(symbol)
