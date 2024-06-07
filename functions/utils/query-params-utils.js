const QueryCaseKeys = {
    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    LIKE: "LIKE",
    EXACT: "EXACT",
    OTHER: "OTHER",
    ANY: "ANY",
    NONE: "NONE"
}

const QueryKeys = {
    AND: "$all",
    OR: "$in",
    SIZE: "$size",
    EQUAL: "$eq",
    EXISTS: "$exists",
    GREATER_THEN: "$gte",
    LESS_THEN: "$lte"
}

/** Query example:
 * Carte con nome che inizia per s, hanno il tag FREMEN ed il requisito FREMEN BOND in rivelazione
 * 
 * {$and: [{name: /^s/i}, {tags: /^fremen/i}, {revelation: {$elemMatch: {requirements: "FREMEN_BOND"}}}]}
 * 
 */

/* RELEASE 0.4.1 - Rimossi effetti dalla ricerca intrighi. Filtrabili solo per tipo e modulo */
export function createIntrigueQueryParams(incomingParams) {
    var andParams = [];
    var typeArray = [];

    // if (incomingParams.name) {
    //     andParams.push({ name: parseParam(incomingParams.name, QueryCaseKeys.LIKE) });
    // }

    /**
     * GIVES VICTORY POINT? true|false
     */
    // if (incomingParams.givesVP) {
    //     andParams.push({ givesVP: parseParam(incomingParams.givesVP, QueryCaseKeys.BOOLEAN) });
    // }

    /* PHASES */
    if (incomingParams.intriguePlotCards || incomingParams.intrigueConflictCards || incomingParams.intrigueEndgameCards) {
        var tempOR = [];
        if (incomingParams.intriguePlotCards) {
            tempOR.push({ phases: "PLOT" });
        }
        if (incomingParams.intrigueConflictCards) {
            tempOR.push({ phases: "CONFLICT" });
        }
        if (incomingParams.intrigueEndgameCards) {
            tempOR.push({ phases: "ENDGAME" });
        }
        andParams.push({ $or: tempOR });
    }

    /* EFFECTS */
    // if (incomingParams.effectRequirements || incomingParams.effectCosts || incomingParams.effectBonuses) {
    //     var object = "effects";
    //     var tempEffectsAnd = [];

    //     if (incomingParams.effectRequirements) {
    //         parseNestedObject(incomingParams.effectRequirements, incomingParams.effectRequirementsAggregator, tempEffectsAnd, object, "requirements");
    //     }

    //     if (incomingParams.effectCosts) {
    //         parseNestedObject(incomingParams.effectCosts, incomingParams.effectCostsAggregator, tempEffectsAnd, object, "costs");
    //     }


    //     if (incomingParams.effectBonuses) {
    //         parseNestedObject(incomingParams.effectBonuses, incomingParams.effectBonusesAggregator, tempEffectsAnd, object, "bonuses");
    //     }

    //     var tempEffectsParams = {};
    //     if (tempEffectsAnd.length > 0) {
    //         tempEffectsParams = {
    //             $and: tempEffectsAnd
    //         };

    //         andParams.push({ [object]: { $elemMatch: tempEffectsParams } });
    //     }

    // }

    /* TYPE */
    var tempOR = [{ type: "INTRIGUE" }];
    if (incomingParams.includesCHOAMModule) {
        if (incomingParams.includesCHOAMModule) {
            tempOR.push({ type: "CHOAM_MODULE" });
        }
    }
    typeArray.push({ $or: tempOR });

    var params = {};
    var array = [{ $or: typeArray }];

    if (andParams.length > 0) {
        var aggregator = incomingParams.globalAggregator === 'AND' ? '$and' : '$or';
        array.push({ [aggregator]: andParams });
    }

    params = {
        $and: array
    };

    return params;
}

export function createImperiumQueryParams(incomingParams) {
    var andParams = [];
    var typeArray = [];

    if (incomingParams.name) {
        andParams.push({ name: parseParam(incomingParams.name, QueryCaseKeys.LIKE) });
    }

    /* TAGS */
    if (incomingParams.tags) {
        //AT LEAST ONE OR NONE
        if (incomingParams.tags[0] === QueryCaseKeys.ANY || incomingParams.tags[0] === QueryCaseKeys.NONE) {
            andParams.push({ 'tags.0': { [QueryKeys.EXISTS]: incomingParams.tags[0] === QueryCaseKeys.ANY } });
        } else {
            //ONLY ONE
            if (incomingParams.tags.length === 1) {
                var query = {
                    tags: parseParam(incomingParams.tags[0], QueryCaseKeys.EXACT)
                };

                //INCLUDES or JUST
                if (!incomingParams.tagsIncludes) {
                    query = {
                        tags: {
                            [QueryKeys.EQUAL]: parseParam(incomingParams.tags[0], QueryCaseKeys.EXACT),
                            [QueryKeys.SIZE]: 1
                        }
                    }
                }

                andParams.push(query);
            } else {
                //'AND' or 'OR'
                var aggregator = incomingParams.tagsAggregator === 'AND' ? QueryKeys.AND : QueryKeys.OR;
                var query = {
                    tags: { [aggregator]: incomingParams.tags }
                };

                //INCLUDES or JUST
                if (!incomingParams.tagsIncludes) {
                    var length = incomingParams.tagsAggregator === 'AND' ? incomingParams.tags.length : 1;
                    query.tags[QueryKeys.SIZE] = length;
                }
                andParams.push(query);
            }
        }
    }

    /* PRICE */
    if (incomingParams.priceFrom || incomingParams.priceTo) {
        andParams.push({ price: { [QueryKeys.GREATER_THEN]: parseParam(incomingParams.priceFrom, QueryCaseKeys.NUMBER), [QueryKeys.LESS_THEN]: parseParam(incomingParams.priceTo, QueryCaseKeys.NUMBER) } })
    }

    /* SYMBOLS */
    if (incomingParams.symbols) {
        //AT LEAST ONE OR NONE
        if (incomingParams.symbols[0] === QueryCaseKeys.ANY || incomingParams.symbols[0] === QueryCaseKeys.NONE) {
            andParams.push({ 'symbols.0': { [QueryKeys.EXISTS]: incomingParams.symbols[0] === QueryCaseKeys.ANY } });
        } else {
            //ONLY ONE
            if (incomingParams.symbols.length === 1) {
                var query = {
                    symbols: parseParam(incomingParams.symbols[0], QueryCaseKeys.EXACT)
                };

                //INCLUDES or JUST
                if (!incomingParams.symbolsIncludes) {
                    query = {
                        symbols: {
                            [QueryKeys.EQUAL]: parseParam(incomingParams.symbols[0], QueryCaseKeys.EXACT),
                            [QueryKeys.SIZE]: 1
                        }
                    }
                }

                andParams.push(query);
            } else {
                //'AND' or 'OR'
                var aggregator = incomingParams.symbolsAggregator === 'AND' ? QueryKeys.AND : QueryKeys.OR;
                var query = {
                    symbols: { [aggregator]: incomingParams.symbols }
                };

                //INCLUDES or JUST
                if (!incomingParams.symbolsIncludes) {
                    var length = incomingParams.symbolsAggregator === 'AND' ? incomingParams.symbols.length : 1;
                    query.symbols[QueryKeys.SIZE] = length;
                }
                andParams.push(query);
            }
        }
    }

    /* OTHER BONUSES */
    if (incomingParams.acquiredBonuses || incomingParams.discardedBonuses || incomingParams.trashedBonuses) {
        var tempOr = [];

        /* ACQUIRED BONUS*/
        if (incomingParams.acquiredBonuses)
            tempOr.push({ 'acquiredBonuses.0': { [QueryKeys.EXISTS]: true } });

        /* DISCARDED BONUS */
        if (incomingParams.discardedBonuses) {
            tempOr.push({ 'discardedBonuses.0': { [QueryKeys.EXISTS]: true } });
        }

        /* TRASHED BONUS */
        if (incomingParams.trashedBonuses) {
            tempOr.push({ 'trashedBonuses.0': { [QueryKeys.EXISTS]: true } });
        }

        if (tempOr.length > 0) {
            andParams.push({ $or: tempOr });
        }
    }

    /**
     * GIVES VICTORY POINT? true|false
     */
    if (incomingParams.givesVP) {
        andParams.push({ givesVP: parseParam(incomingParams.givesVP, QueryCaseKeys.BOOLEAN) });
    }

    /* PERSUASION */
    if (incomingParams.persuasionFrom || incomingParams.persuasionTo) {
        andParams.push({ persuasion: { [QueryKeys.GREATER_THEN]: parseParam(incomingParams.persuasionFrom, QueryCaseKeys.NUMBER), [QueryKeys.LESS_THEN]: parseParam(incomingParams.persuasionTo, QueryCaseKeys.NUMBER) } })
    }

    /* SWORDS */
    if (incomingParams.swordsFrom || incomingParams.swordsTo) {
        andParams.push({ swords: { [QueryKeys.GREATER_THEN]: parseParam(incomingParams.swordsFrom, QueryCaseKeys.NUMBER), [QueryKeys.LESS_THEN]: parseParam(incomingParams.swordsTo, QueryCaseKeys.NUMBER) } })
    }

    /* REVELATION */
    if (incomingParams.revelationRequirements || incomingParams.revelationCosts || incomingParams.revelationBonuses) {
        var object = "revelation";
        var tempRevelationAnd = [];

        if (incomingParams.revelationRequirements) {
            parseNestedObject(incomingParams.revelationRequirements, incomingParams.revelationRequirementsAggregator, tempRevelationAnd, object, "requirements");
        }

        if (incomingParams.revelationCosts) {
            parseNestedObject(incomingParams.revelationCosts, incomingParams.revelationCostsAggregator, tempRevelationAnd, object, "costs");
        }


        if (incomingParams.revelationBonuses) {
            parseNestedObject(incomingParams.revelationBonuses, incomingParams.revelationBonusesAggregator, tempRevelationAnd, object, "bonuses");
        }

        var tempRevelationParams = {};
        if (tempRevelationAnd.length > 0) {
            tempRevelationParams = {
                $and: tempRevelationAnd
            };

            andParams.push({ [object]: { $elemMatch: tempRevelationParams } });
        }

    }

    /* EFFECTS */
    if (incomingParams.effectRequirements || incomingParams.effectCosts || incomingParams.effectBonuses) {
        var object = "effects";
        var tempEffectsAnd = [];

        if (incomingParams.effectRequirements) {
            parseNestedObject(incomingParams.effectRequirements, incomingParams.effectRequirementsAggregator, tempEffectsAnd, object, "requirements");
        }

        if (incomingParams.effectCosts) {
            parseNestedObject(incomingParams.effectCosts, incomingParams.effectCostsAggregator, tempEffectsAnd, object, "costs");
        }


        if (incomingParams.effectBonuses) {
            parseNestedObject(incomingParams.effectBonuses, incomingParams.effectBonusesAggregator, tempEffectsAnd, object, "bonuses");
        }

        var tempEffectsParams = {};
        if (tempEffectsAnd.length > 0) {
            tempEffectsParams = {
                $and: tempEffectsAnd
            };

            andParams.push({ [object]: { $elemMatch: tempEffectsParams } });
        }

    }

    /* TYPE */
    var tempOR = [{ type: "IMPERIUM_ROW" }];
    if (incomingParams.includesCHOAMModule || incomingParams.includesPrepareTheWay || incomingParams.includesTSMF || incomingParams.includesRiseOfIX || incomingParams.includesImmortality) {
        if (incomingParams.includesCHOAMModule) {
            tempOR.push({ type: "CHOAM_MODULE" });
        }
        if (incomingParams.includesPrepareTheWay) {
            tempOR.push({ type: "PREPARE_THE_WAY" });
        }
        if (incomingParams.includesTSMF) {
            tempOR.push({ type: "TSMF" });
        }
        if (incomingParams.includesRiseOfIX) {
            tempOR.push({ type: "RISE_OF_IX" });
        }
        if (incomingParams.includesImmortality) {
            tempOR.push({ type: "IMMORTALITY" });
        }
    }
    typeArray.push({ $or: tempOR });

    var params = {};
    var array = [{ $or: typeArray }];

    if (andParams.length > 0) {
        var aggregator = incomingParams.globalAggregator === 'AND' ? '$and' : '$or';
        array.push({ [aggregator]: andParams });
    }

    params = {
        $and: array
    };

    return params;
}

function parseParam(param, key) {
    switch (key) {
        case QueryCaseKeys.NUMBER:
            return parseInt(param);
        case QueryCaseKeys.LIKE:
            return new RegExp(param, 'i');
        case QueryCaseKeys.BOOLEAN:
            return param === 'true';
        default:
            return param;
    }
}

function parseNestedObject(params, paramsAggregator, finalAnd, object, key) {
    //AT LEAST ONE OR NONE
    if (params[0] === QueryCaseKeys.ANY || params[0] === QueryCaseKeys.NONE) {
        finalAnd.push({ [`${key}.0`]: { [QueryKeys.EXISTS]: params[0] === QueryCaseKeys.ANY } });
    } else {
        //ONLY ONE
        if (params.length === 1) {
            var query = {
                [key]: parseParam(params[0], QueryCaseKeys.EXACT)
            };

            //INCLUDES or JUST
            // if (!incomingParams.symbolsIncludes) {
            //     query = {
            //         symbols: {
            //             [QueryKeys.EQUAL]: parseParam(incomingParams.symbols[0], QueryCaseKeys.EXACT),
            //             [QueryKeys.SIZE]: 1
            //         }
            //     }
            // }

            finalAnd.push(query);
        } else {
            //'AND' or 'OR'
            var aggregator = paramsAggregator === 'AND' ? QueryKeys.AND : QueryKeys.OR;
            var query = {
                [key]: { [aggregator]: params }
            };

            //INCLUDES or JUST
            // if (!incomingParams.symbolsIncludes) {
            //     var length = incomingParams.symbolsAggregator === 'AND' ? 2 : 1;
            //     query.symbols[QueryKeys.SIZE] = length;
            // }
            finalAnd.push(query);
        }
    }
}

export function createMultipleImperiumQueryParams(filters) {
    var orParams = [];

    for (const filter of filters) {
        orParams.push(createImperiumQueryParams(filter.filters));
    }

    var params = {};
    if (orParams.length > 0) {
        params = {
            $or: orParams
        };
    }
    return params;
}

export function createMultipleIntrigueQueryParams(filters) {
    var orParams = [];

    for (const filter of filters) {
        if (filter.filters.includesIntrigueCards)
            orParams.push(createIntrigueQueryParams(filter.filters));
    }

    var params = null;
    if (orParams.length > 0) {
        params = {
            $or: orParams
        };
    }
    return params;
}