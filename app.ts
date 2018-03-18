#!/usr/bin/env ts-node

import * as fs from "fs";

import { Run, Options, quicktypeMultiFile } from "quicktype";
import { JavaTargetLanguage, JavaRenderer } from "quicktype/dist/Language/Java"
import { TypeGraph } from "quicktype/dist/TypeGraph";
import { ConvenienceRenderer } from "quicktype/dist/ConvenienceRenderer";
import { ClassType, ClassProperty, Type } from "quicktype/dist/Type";
import { Name, FixedName } from "quicktype/dist/Naming";
import { capitalize } from "quicktype/dist/Strings";
import { parseCLIOptions, makeQuicktypeOptions, writeOutput } from "quicktype/dist/cli";

class CustomJavaTargetLanguage extends JavaTargetLanguage {
    protected get rendererClass(): new (
        graph: TypeGraph,
        leadingComments: string[] | undefined,
        ...optionValues: any[]
    ) => ConvenienceRenderer {
        return CustomJavaRenderer;
    }
}

class CustomJavaRenderer extends JavaRenderer {
    protected makeNameForNamedTyped(t: Type): Name {
        return new FixedName(`${capitalize(t.kind)}_${t.getCombinedName()}`);
    }

    protected makeNameForTopLevel(t: Type, givenName: string, maybeNamedType: Type | undefined): Name {
        if (maybeNamedType !== undefined) {
            return this.makeNameForNamedTyped(maybeNamedType);
        }
        return new FixedName(`${capitalize(t.kind)}_${givenName}`);
    }

    protected makeNameForProperty(_c: ClassType, _className: Name, _p: ClassProperty, jsonName: string): Name {
        return new FixedName(jsonName);
    }

    protected makeNamesForPropertyGetterAndSetter(
        _c: ClassType,
        _className: Name,
        _p: ClassProperty,
        jsonName: string,
        _name: Name
    ): [Name, Name] {
        return [new FixedName(`get_${jsonName}`), new FixedName(`set_${jsonName}`)];
    }

    protected emitClassAttributes(c: ClassType, className: Name): void {
        super.emitClassAttributes(c, className);
        this.emitLine("@JsonIgnoreProperties(ignoreUnknown=true)");
        if (c.properties.some(cp => cp.type.isNullable)) {
            this.emitLine("@JsonInclude(JsonInclude.Include.NON_ABSENT)");
        }
    }
}

async function main(args: string[]) {
    const lang = new CustomJavaTargetLanguage();

    const cliOptions = parseCLIOptions(args, lang);

    const quicktypeOptions = await makeQuicktypeOptions(cliOptions, [lang]);
    if (quicktypeOptions === undefined) return;

    quicktypeOptions.lang = lang;

    const resultsByFilename = await quicktypeMultiFile(quicktypeOptions);

    writeOutput(cliOptions, resultsByFilename);
}

main(process.argv.slice(2));
