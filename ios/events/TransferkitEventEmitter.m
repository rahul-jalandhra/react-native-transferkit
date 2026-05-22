#import "TransferkitEventEmitter.h"

@implementation TransferkitEventEmitter

static TransferkitEventEmitter *sharedInstance = nil;

RCT_EXPORT_MODULE();

+ (instancetype)shared
{
    return sharedInstance;
}

- (instancetype)init
{
    self = [super init];

    if (self) {
        sharedInstance = self;
    }

    return self;
}

- (NSArray<NSString *> *)supportedEvents
{
    return @[
        @"onStreamData",
        @"onStreamComplete",
        @"onStreamError",
        @"onStreamCancel"
    ];
}

@end