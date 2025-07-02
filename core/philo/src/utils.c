/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utils.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:26:51 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:22:04 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

int	is_digit(char c)
{
	if (c >= '0' && c <= '9')
		return (1);
	return (0);
}

int	is_space(char c)
{
	if ((c >= 9 && c <= 13) || c == 32)
		return (1);
	return (0);
}

void	error_exit(const char *str)
{
	printf("%s\n", str);
	exit(EXIT_FAILURE);
}

const char	*valid_input(const char *str)
{
	int			len;
	const char	*number;
	int			i;

	i = 0;
	len = 0;
	while (is_space(*str))
		++str;
	if (*str == '+')
		++str;
	else if (*str == '-')
		error_exit("negatives are not allowed");
	if (!is_digit(*str))
		error_exit("input is not a valid digit");
	number = str;
	while (is_digit(str[i]))
	{
		i++;
		len++;
	}
	if (len > 10)
		error_exit("number is greater than INT_MAX");
	return (number);
}

long	ft_atol(const char *str)
{
	long	num;
	int		i;

	i = 0;
	num = 0;
	str = valid_input(str);
	while (is_digit(str[i]))
	{
		num = (num * 10) + (str[i] - 48);
		i++;
	}
	if (num > INT_MAX)
		error_exit("value greater than int_max");
	return (num);
}
