// CommandLineTest.cpp : Defines the entry point for the console application.

#include "stdafx.h"
#include "CommandLineParser.h"

struct TestCommandLine : public StandardCommandLineParser
{
public:
    // Create flags and params
    FlagArg                         debug;
    FlagArg                         regserver;
    ValueArg<int>                   minX;
    ValueArg<double>                intensity;
    ValueArg<tstring>               foo;
    RestrictedValueArg<tstring>     ext;
    MultiValueArg<tstring>          i;
    MultiValueArg<FileNameValue>    files;

public:
    TestCommandLine()
        // Set names and descriptions for usage
    :   debug(__T("debug"), __T("Turn on debugger.")),
        regserver(__T("regserver"), __T("Register the server.")),
        minX(__T("MinX"), __T("Minimum x value.")),
        intensity(__T("Intensity"), __T("Intensity value.")),
        foo(__T("foo"), __T("Not the bar.")),
        i(__T("i"), __T("Include directories.")),
        files(__T("files"), __T("File names.")),
        ext(__T("ext"), __T("File extension"))
    {
        // Add flags matched, e.g. /foo
        AddFlag(debug);
        debug.SetCaseSensitive();

        AddFlag(regserver);

        AddFlag(minX);
        minX.SetDefaultValue(10);

        AddFlag(intensity);
        //intensity.SetDefaultValue(1.1);   // No default means this arg is required

        AddFlag(i);
        AddFlag(foo);
        foo.SetDefaultValue(__T("bar"));

        // Add params matched by position, e.g. foo
        AddParam(files);

        // Test RestrictedValueArg
        AddFlag(ext);
        ext.AddValue(__T("bmp"));
        ext.AddValue(__T("gif"));
        ext.AddValue(__T("jpg"));
        ext.SetDefaultValue(__T("bmp"));
    }
};

void _tmain(int argc, LPCTSTR* argv)
{
    // Parse the command line and show help or version or error
    TestCommandLine cl;
    if( !cl.ParseAndContinue(argc, argv) ) return;

    // Harvest values
    tcout << __T("debug: ") << cl.debug << std::endl;
    tcout << __T("minX: ") << cl.minX << std::endl;
    tcout << __T("intensity: ") << cl.intensity << std::endl;
    tcout << __T("foo: ") << cl.foo.Value() << std::endl;
    tcout << __T("ext: ") << cl.ext.Value() << std::endl;

    const std::vector<tstring>& includes = cl.i;
    tcout << __T("includes:") << std::endl;
    for(std::vector<tstring>::const_iterator incl = includes.begin(); incl != includes.end(); ++incl)
        tcout << __T("    '") << *incl << __T("'") << std::endl;

    const std::vector<FileNameValue>& params = cl.files.Values();
    tcout << __T("nameValuePairs:") << std::endl;
    for(std::vector<FileNameValue>::const_iterator p = params.begin(); p != params.end(); ++p)
        tcout << __T("    '") << *p << __T("'") << (p->Exists() ? __T(" (exists)") : __T(" (doesn't exist)")) << std::endl;
}
