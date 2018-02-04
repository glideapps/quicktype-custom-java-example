#!/usr/bin/env ts-node

import * as fs from "fs";

import { Run, Options } from "quicktype";
import { JavaTargetLanguage, JavaRenderer } from "quicktype/dist/Language/Java"
import { TypeGraph } from "quicktype/dist/TypeGraph";
import { ConvenienceRenderer } from "quicktype/dist/ConvenienceRenderer";
import { ClassType } from "quicktype/dist/Type";
import { Name } from "quicktype/dist/Naming";

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
    constructor(
        graph: TypeGraph,
        leadingComments: string[] | undefined,
        private readonly packageName: string,
        private readonly justTypes: boolean
    ) {
        super(graph, leadingComments, packageName, justTypes);
    }

    protected emitClassAttributes(c: ClassType, className: Name): void {
        super.emitClassAttributes(c, className);
        this.emitLine("@JsonIgnoreProperties(ignoreUnknown=true)");
        if (c.properties.some(cp => cp.type.isNullable)) {
            this.emitLine("@JsonInclude(JsonInclude.Include.NON_ABSENT)");
        }
    }
}

async function main() {
    const schema = fs.readFileSync("input.schema", "utf8");
    const lang = new CustomJavaTargetLanguage();
    const options: Partial<Options> = {
        lang,
        sources: [ { name: "TopLevel", schema }]
    };
    const run = new Run(options);
    const files = await run.run();
    files.forEach((srr, filename) => {
        console.log(`// ${filename}`);
        console.log("//");
        for (var line of srr.lines) {
            console.log(line);
        }
    });
}

main();
