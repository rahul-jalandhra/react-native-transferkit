#import <Foundation/Foundation.h>

@interface TKStreamManager : NSObject <
    NSURLSessionDataDelegate
>

+ (instancetype)shared;

- (void)startStream:(NSString *)url
             method:(NSString *)method
            headers:(NSDictionary *)headers
               body:(NSString *)body;

- (void)cancelStream;

@end